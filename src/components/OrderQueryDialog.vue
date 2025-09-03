<template>
  <el-dialog
    title="订单查询"
    :visible.sync="dialogVisible"
    width="1200px"
    :close-on-click-modal="false"
    :modal-append-to-body="false"
    append-to-body
    class="order-query-dialog"
  >
    <!-- 查询条件 -->
    <div class="query-form">
      <div class="query-item">
        <label>产品名称：</label>
        <el-input
          v-model="queryForm.productName"
          placeholder="请输入产品名称"
          style="width: 200px"
          clearable
        ></el-input>
      </div>
      <div class="query-item">
        <label>订单状态：</label>
        <el-select
          v-model="queryForm.orderStatus"
          placeholder="请选择订单状态"
          style="width: 150px"
          clearable
        >
          <el-option label="执行中" :value="0"></el-option>
          <el-option label="已完成" :value="1"></el-option>
        </el-select>
      </div>
      <div class="query-item">
        <el-button type="primary" @click="handleSearch" :loading="loading">
          <i class="el-icon-search"></i>查询
        </el-button>
        <el-button @click="handleReset">
          <i class="el-icon-refresh-left"></i>重置
        </el-button>
      </div>
    </div>

    <!-- 查询结果表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        element-loading-text="正在查询..."
        style="width: 100%"
        max-height="400px"
      >
        <el-table-column
          prop="orderId"
          label="订单号"
          width="120"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="productName"
          label="产品名称"
          min-width="120"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="trayCode"
          label="托盘码"
          width="120"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="orderStatus"
          label="订单状态"
          width="100"
          align="center"
        >
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.orderStatus)">
              {{ getStatusText(scope.row.orderStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="isTerile"
          label="是否灭菌"
          width="100"
          align="center"
        >
          <template slot-scope="scope">
            <el-tag :type="scope.row.isTerile === 1 ? 'success' : 'info'">
              {{ scope.row.isTerile === 1 ? '灭菌' : '不灭菌' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inPut" label="进货口" width="100" align="center">
          <template slot-scope="scope">
            {{ getInPutText(scope.row.inPut) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="insertTime"
          label="创建时间"
          width="180"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="finishTime"
          label="完成时间"
          width="180"
          show-overflow-tooltip
        ></el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.pageNum"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
      >
      </el-pagination>
    </div>
  </el-dialog>
</template>

<script>
import HttpUtil from '@/utils/HttpUtil';

export default {
  name: 'OrderQueryDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      queryForm: {
        productName: '',
        orderStatus: null
      },
      tableData: [],
      pagination: {
        pageNum: 1,
        pageSize: 20,
        total: 0
      }
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit('update:visible', val);
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.handleSearch();
      }
    }
  },
  methods: {
    // 处理查询
    async handleSearch() {
      this.loading = true;
      try {
        const params = {
          pageNum: this.pagination.pageNum,
          pageSize: this.pagination.pageSize,
          invalidFlag: 0, // 固定参数：查不作废的数据
          ...this.queryForm
        };

        // 清空空值参数
        Object.keys(params).forEach((key) => {
          if (
            params[key] === '' ||
            params[key] === null ||
            params[key] === undefined
          ) {
            delete params[key];
          }
        });

        const response = await HttpUtil.post('/order/selectListByPage', params);
        if (response && response.data) {
          this.tableData = response.data.list || [];
          this.pagination.total = response.data.total || 0;
        } else {
          this.tableData = [];
          this.pagination.total = 0;
        }
      } catch (error) {
        console.error('查询订单失败:', error);
        this.$message.error('查询订单失败，请重试');
        this.tableData = [];
        this.pagination.total = 0;
      } finally {
        this.loading = false;
      }
    },

    // 重置查询条件
    handleReset() {
      this.queryForm = {
        productName: '',
        orderStatus: null
      };
      this.pagination.pageNum = 1;
      this.handleSearch();
    },

    // 每页大小改变
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.pageNum = 1;
      this.handleSearch();
    },

    // 当前页改变
    handleCurrentChange(val) {
      this.pagination.pageNum = val;
      this.handleSearch();
    },

    // 获取订单状态文本
    getStatusText(status) {
      const statusMap = {
        0: '执行中',
        1: '已完成'
      };
      return statusMap[status] || '未知';
    },

    // 获取订单状态标签类型
    getStatusType(status) {
      const typeMap = {
        0: 'warning', // 待执行 - 灰色
        1: 'success' // 执行中 - 橙色
      };
      return typeMap[status] || 'info';
    },

    // 获取进货口文本
    getInPutText(inPut) {
      const inPutMap = {
        1: '一楼',
        2: '二楼',
        3: '三楼',
        4: '四楼'
      };
      return inPutMap[inPut] || '未知';
    }
  }
};
</script>

<style lang="less" scoped>
.order-query-dialog {
  .query-form {
    padding: 10px 0;
    margin-bottom: 10px;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;

    .query-item {
      display: flex;
      align-items: center;
      gap: 8px;

      label {
        font-size: 14px;
        color: #606266;
        white-space: nowrap;
      }

      .el-button + .el-button {
        margin-left: 10px;
      }
    }
  }

  .table-container {
    margin-bottom: 15px;
  }

  .pagination-container {
    text-align: right;
    padding: 15px 0;
    border-top: 1px solid #ebeef5;
  }
}
</style>
