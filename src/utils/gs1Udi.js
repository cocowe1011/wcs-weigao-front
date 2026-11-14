/**
 * 把扫码枪读到的 GS1 串转成 MSE 要求的带括号格式。
 * 有 GS（ASCII 29）时按标准切：定长 AI 取固定位数，变长 AI 读到 GS 或结尾。
 * 没有分隔符（手输、粘贴）时，沿用批号后「11+日期+17+日期」的兜底。
 * 加括号后再去掉必须与原始字母数字完全一致，否则退回裸串。
 */

const GS = '\x1d';

/** 2 位定长 AI → 数据位数（不含 AI 本身）。00/01/02 必须带引号，否则会丢前导零 */
const FIXED_AI_LENGTH = {
  '00': 18,
  '01': 14,
  '02': 14,
  11: 6,
  12: 6,
  13: 6,
  15: 6,
  16: 6,
  17: 6,
  20: 2
};

function alnum(value) {
  return String(value || '').replace(/[^0-9A-Za-z]/g, '');
}

function isVariableAi(ai) {
  return ai === '10' || ai === '21' || (ai >= '90' && ai <= '99');
}

/**
 * 变长 AI 的数据位数上限（GS1 标准）：10 批号 20 位、21 序列号 20 位、90-99 厂商自定义 30 位。
 * 超过上限说明分隔符缺失、字段被串读（如 (10) 把后面的 11/17/91/21 全吞了），
 * 此时必须判定本次按 GS 解析无效，退回日期兜底重解析，不能把错分段直接交给 MSE。
 */
function maxVariableLength(ai) {
  if (ai >= '90' && ai <= '99') return 30;
  return 20;
}

function normalizeUdiRaw(raw) {
  let text = String(raw).trim();
  text = text.replace(/^\](?:d2|C1|e0|Q3)/i, '');
  // 只有 F< 包装使用 * 结束符，其他输入沿用原有字符清洗规则。
  if (/^F</.test(text)) {
    text = text.replace(/^F<\s*'?/, '').split('*')[0];
  }
  text = text.replace(/<GS>/gi, GS).replace(/\{GS\}/gi, GS);
  text = text.replace(/\u241d/g, GS);
  // 保留字段边界，清除引号、空格等扫码包装字符。
  // eslint-disable-next-line no-control-regex
  return text.replace(/[^0-9A-Za-z\x1d()]/g, '');
}

/**
 * 按 GS 分隔符解析。无法识别的 AI 返回空串，交给日期兜底。
 */
function parseByGroupSeparator(source, anchors) {
  let index = 0;
  let result = '';
  while (index < source.length) {
    if (source.charAt(index) === GS) {
      index += 1;
      continue;
    }
    if (index + 2 > source.length) return '';
    const fieldStart = index;
    const ai = source.substr(index, 2);
    index += 2;
    const fixedLength = FIXED_AI_LENGTH[ai];
    let value = '';
    if (fixedLength) {
      if (index + fixedLength > source.length) return '';
      value = source.substr(index, fixedLength);
      if (value.indexOf(GS) !== -1) return '';
      index += fixedLength;
    } else if (isVariableAi(ai)) {
      const gsAt = source.indexOf(GS, index);
      const end = gsAt === -1 ? source.length : gsAt;
      value = source.substring(index, end);
      if (!value || value.length > maxVariableLength(ai)) return '';
      if (gsAt !== -1) {
        anchors.push({
          ai,
          start: alnum(source.substring(0, fieldStart)).length,
          end: alnum(source.substring(0, end)).length
        });
      }
      index = end;
    } else {
      return '';
    }
    result += `(${ai})${value}`;
  }
  return result;
}

/**
 * 无分隔符时的兜底。批号 (10) 变长，必须看到「11 + 合法日期 + 17 + 合法日期」才截断，
 * 避免批号 20261101 里的 11 被当成生产日期。
 */
function parseByDateHeuristic(cleanUdi) {
  let result = '';
  let position = 0;
  if (cleanUdi.substr(0, 2) === '01') {
    position = 2;
  }
  if (position + 14 <= cleanUdi.length) {
    result += `(01)${cleanUdi.substr(position, 14)}`;
    position += 14;
  }
  if (position + 2 < cleanUdi.length && cleanUdi.substr(position, 2) === '10') {
    position += 2;
    let foundNext = false;
    const remaining = cleanUdi.substr(position);
    const isValidDate = (dateStr) => {
      if (!/^\d{6}$/.test(dateStr)) return false;
      const mm = parseInt(dateStr.substr(2, 2), 10);
      const dd = parseInt(dateStr.substr(4, 2), 10);
      return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
    };
    const candidates = [];
    for (let i = 1; i < remaining.length - 7; i++) {
      if (remaining.substr(i, 2) !== '11') continue;
      const prodDate = remaining.substr(i + 2, 6);
      if (!isValidDate(prodDate)) continue;
      const expIndex = i + 2 + 6;
      if (remaining.substr(expIndex, 2) !== '17') continue;
      const expDate = remaining.substr(expIndex + 2, 6);
      if (!isValidDate(expDate)) continue;
      candidates.push({ i, prodDate, expDate });
    }
    const hit =
      candidates.find((item) => item.prodDate <= item.expDate) || candidates[0];
    if (hit) {
      result += `(10)${remaining.substr(0, hit.i)}`;
      position += hit.i;
      foundNext = true;
    }
    if (!foundNext && position + 8 <= cleanUdi.length) {
      result += `(10)${cleanUdi.substr(position, 8)}`;
      position += 8;
    }
  }
  if (position + 2 < cleanUdi.length && cleanUdi.substr(position, 2) === '11') {
    position += 2;
    if (position + 6 <= cleanUdi.length) {
      result += `(11)${cleanUdi.substr(position, 6)}`;
      position += 6;
    }
  }
  if (position + 2 < cleanUdi.length && cleanUdi.substr(position, 2) === '17') {
    position += 2;
    if (position + 6 <= cleanUdi.length) {
      result += `(17)${cleanUdi.substr(position, 6)}`;
      position += 6;
    }
  }
  if (position + 2 < cleanUdi.length && cleanUdi.substr(position, 2) === '91') {
    position += 2;
    const remainingPart = cleanUdi.substr(position);
    const ai21Index = remainingPart.indexOf('21');
    if (ai21Index !== -1) {
      result += `(91)${remainingPart.substr(0, ai21Index)}`;
      position += ai21Index;
    }
  }
  if (position + 2 < cleanUdi.length && cleanUdi.substr(position, 2) === '21') {
    position += 2;
    if (position < cleanUdi.length) {
      result += `(21)${cleanUdi.substr(position)}`;
    }
  }
  return result;
}

/**
 * 清洗出库里的 uid 口径：剥掉扫描引擎可能加的 AIM 前缀（]C1 等）、F< 前缀和 <GS> 标记后，
 * 再去掉所有非字母数字字符（含 GS 分隔符）。
 * 必须与 parseUDICode 使用同一套前缀剥离规则，否则会出现：MSE 能查到数据、
 * 但本地按 uid 查档查不到，进而重复建档。
 */
export function cleanUid(raw) {
  // 必须先挡掉空值：String(undefined) 会变成 "undefined"，
  // MSE 返回缺 udi 的货物时会被当成真实 uid 写库、还会误判重复
  if (!raw) return '';
  const normalized = normalizeUdiRaw(raw);
  return alnum(normalized);
}

function hasNonemptyFields(parsed) {
  return /^(?:\(\d{2}\)[0-9A-Za-z]+)+$/.test(parsed);
}

/** 日期兜底不能跨过已有 GS，也不能重切已由 GS 确定的变长字段。 */
function respectsSeparators(source, parsed, anchors) {
  const segments = [];
  const pattern = /\((\d{2})\)([0-9A-Za-z]+)/g;
  let match;
  let offset = 0;
  while ((match = pattern.exec(parsed))) {
    const start = offset;
    offset += 2 + match[2].length;
    segments.push({ ai: match[1], start, end: offset });
  }
  offset = 0;
  for (const char of source) {
    if (char !== GS) {
      offset += 1;
      continue;
    }
    if (offset && !segments.some((segment) => segment.end === offset))
      return false;
  }
  return anchors.every((anchor) =>
    segments.some(
      (segment) =>
        segment.ai === anchor.ai &&
        segment.start === anchor.start &&
        segment.end === anchor.end
    )
  );
}

export function parseUDICode(rawUdi) {
  if (!rawUdi) return '';
  const normalized = normalizeUdiRaw(rawUdi);
  const digits = alnum(normalized);
  if (!digits) return '';
  try {
    const source = normalized.replace(/[()]/g, '');
    // 括号和 GS 可以同时存在；仅在二者边界一致时采用显式分段。
    // 不能直接删掉 GS 后采信括号，否则只有部分括号的输入可能吞掉后续字段。
    const explicit = normalized.split(GS).join('');
    if (hasNonemptyFields(explicit) && respectsSeparators(source, explicit, []))
      return explicit;
    const hasGS = source.indexOf(GS) !== -1;
    const anchors = [];
    if (hasGS) {
      const direct = parseByGroupSeparator(source, anchors);
      // 完整 GS 解析成功即采用，字段数量更多不能作为覆盖真实边界的理由。
      if (hasNonemptyFields(direct) && alnum(direct) === digits) return direct;
    }
    // 保留本项目原有的日期对兜底，不替换为其他项目的裸码猜测规则。
    const fallback = parseByDateHeuristic(digits);
    if (
      !hasNonemptyFields(fallback) ||
      alnum(fallback) !== digits ||
      (hasGS && !respectsSeparators(source, fallback, anchors))
    )
      return digits;
    return fallback;
  } catch (error) {
    console.error('UDI解析失败:', error);
    return digits;
  }
}
