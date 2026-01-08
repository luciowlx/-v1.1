/**
 * 分类标签配置
 * 定义不同类型的分类列及其可能的取值
 */
const CLASSIFICATION_LABELS = {
  quality_grade: ['A级', 'B级', 'C级', 'D级'],
  defect_type: ['无缺陷', '轻微缺陷', '中度缺陷', '严重缺陷'],
  equipment_status: ['正常运行', '性能下降', '需要维护', '故障停机'],
  alarm_level: ['无告警', '低级告警', '中级告警', '高级告警', '紧急告警'],
  product_class: ['合格', '不合格'],
  operation_mode: ['自动', '手动', '维护模式'],
  shift: ['早班', '中班', '晚班'],
  risk_level: ['低风险', '中风险', '高风险'],
};

/**
 * 辅助函数：生成模拟行业数据
 * @param prefix 字段名前缀
 * @param fields 列数
 * @param rows 行数
 * @param classificationCols 分类列配置（列名 -> 标签类型）
 */
function generateIndustryData(
  prefix: string,
  fields: string[],
  rows: number,
  classificationCols?: Record<string, keyof typeof CLASSIFICATION_LABELS>
): any[] {
  return Array.from({ length: rows }).map((_, rIdx) => {
    const row: any = { datatime: `2025-01-04 10:${String(rIdx).padStart(2, '0')}:00` };
    fields.forEach((field, fIdx) => {
      if (field === 'datatime') return;
      // 生成随机但合理的物理数值
      const base = 40 + (fIdx % 5) * 10;
      row[field] = Number((base + Math.random() * 5 + Math.sin(rIdx) * 2).toFixed(2));
    });
    // 添加分类列
    if (classificationCols) {
      Object.entries(classificationCols).forEach(([colName, labelType]) => {
        const labels = CLASSIFICATION_LABELS[labelType];
        row[colName] = labels[Math.floor(Math.random() * labels.length)];
      });
    }
    return row;
  });
}

// 钢铁冷轧字段（添加分类列）
const STEEL_FIELDS = ["datatime", "Rolling_Force", "Rolling_Speed", "Entry_Tension", "Exit_Tension", "Motor_Current", "Motor_Voltage", "Coolant_Pressure", "Coolant_Temp", "Strip_Thickness", "Strip_Width", "Work_Roll_Gap", "Leveller_Current", "Coiler_Tension", "Uncoiler_Tension", "Edge_Temp_L", "Edge_Temp_R", "Center_Temp", "Vibration_Level", "Lubrication_Flow", "Strip_Speed_Exit", "Load_Cell_LC1", "Load_Cell_LC2", "Drive_Torque", "Brake_Pressure"];
const STEEL_CLASSIFICATION_COLS = {
  Quality_Grade: 'quality_grade' as const,
  Defect_Type: 'defect_type' as const,
  Product_Status: 'product_class' as const,
};

// 化工工艺字段（添加分类列）
const PROCESS_FIELDS = ["datatime", "Tower_Pressure", "Top_Temp", "Middle_Temp", "Bottom_Temp", "Feed_Flow", "Reflux_Ratio", "Steam_Flow", "Product_Purity", "Catalyst_Level", "Cooling_Water_In", "Cooling_Water_Out", "Exchanger_DP", "Pump_Frequency", "Valve_Opening", "Ambient_Temp", "Heater_Current", "Heater_Voltage", "O2_Concentration", "CO_Concentration", "Viscosity_Index", "Density_Sensor", "Flow_Meter_1", "Flow_Meter_2", "Level_Indicator"];
const PROCESS_CLASSIFICATION_COLS = {
  Alarm_Level: 'alarm_level' as const,
  Operation_Mode: 'operation_mode' as const,
  Risk_Level: 'risk_level' as const,
};

// 设备监控字段（添加分类列）
const EQUIP_FIELDS = ["datatime", "Vibration_RMS", "Vibration_Peak", "Bearing_Temp_DE", "Bearing_Temp_NDE", "Winding_Temp_U", "Winding_Temp_V", "Winding_Temp_W", "Oil_Pressure", "Oil_Temp", "Inlet_Filter_DP", "Discharge_Temp", "Discharge_Pressure", "Motor_Speed", "Input_Current", "Input_Voltage", "Power_Factor", "Active_Power", "Reactive_Power", "Ambient_Humidity", "Cooler_Fan_Status", "Running_Hours", "Starts_Count", "Load_Cycle", "Unload_Cycle"];
const EQUIP_CLASSIFICATION_COLS = {
  Equipment_Status: 'equipment_status' as const,
  Alarm_Level: 'alarm_level' as const,
  Shift: 'shift' as const,
};

// 风电 SCADA 字段（添加分类列）
const WIND_FIELDS = ["datatime", "WROT_TemAxis1Ctrl", "WROT_TemAxis2Ctrl", "WROT_TemAxis3Ctrl", "WROT_PtCapTemBl1", "WROT_PtCapTemBl2", "WROT_PtCapTemBl3", "WROT_TemB1Mot", "WROT_TemB2Mot", "WROT_TemB3Mot", "WROT_TemHub", "WROT_TemHub2", "WROT_TemHub3", "WROT_Pitch1CapHighVol", "WROT_Pitch2CapHighVol", "WROT_Pitch3CapHighVol", "WROT_CurBlade1Motor", "WROT_CurBlade2Motor", "WROT_CurBlade3Motor", "WROT_Blade1Position", "WROT_Blade2Position", "WROT_Blade3Position", "WROT_TemBlade1Inver", "WROT_TemBlade2Inver", "WROT_TemBlade3Inver", "WTRM_TemGeaOil", "WTRM_TemGeaMSDE", "WTRM_TemGeaZSDE", "WTRM_GBoxOilPmpP", "WTRM_TemGBoxOilE", "WCNV_GridPPower", "WCNV_GridQPower", "WWPP_APProduction", "WGEN_TemGenDriEnd", "WGEN_TemGenNonDE", "WGEN_TemGenStaU", "WGEN_TemGenStaV", "WGEN_TemGenStaW", "WGEN_TemGenStaU2", "WGEN_TemGenStaV2", "WGEN_TemGenStaW3", "WGEN_GenCoolAirTem", "WNAC_WindSpeed", "WNAC_WindDirection", "WNAC_TemOut", "WNAC_TemNacelleCab", "WNAC_TemNacelleCabOut", "WVIB_VibrationLFil", "WVIB_VibrationVFil", "WYAW_YawPosition", "WYAW_Brake_Pressure", "WTOW_TemTowerCab", "WTRM_RotorSpd", "WTRM_PowerStoreTRBS", "WTRM_TemMainBearing", "WTRM_TemMainBearing2", "WGEN_GenActivePW", "WGEN_GenReactivePW", "WGEN_GenSpd", "WGEN_Torque", "WGEN_TorqueSetpoint"];
const WIND_CLASSIFICATION_COLS = {
  Turbine_Status: 'equipment_status' as const,
  Fault_Level: 'alarm_level' as const,
  Operation_Mode: 'operation_mode' as const,
};

// 传感器字段（添加分类列）
const SENSOR_FIELDS = ["datatime", "temperature", "humidity", "pressure", "vibration", "voltage", "current", "rpm", "torque", "power", "energy", "status_code"];
const SENSOR_CLASSIFICATION_COLS = {
  Equipment_Health: 'equipment_status' as const,
  Alert_Level: 'alarm_level' as const,
};

export type PreviewRow = Record<string, any>;

export const datasetPreviewRows: Record<string, PreviewRow[]> = {
  // 钢铁冷轧（含分类列：质量等级、缺陷类型、产品状态）
  '冷轧生产参数_2024.csv': generateIndustryData('STEEL', STEEL_FIELDS, 20, STEEL_CLASSIFICATION_COLS),

  // 化工工艺（含分类列：告警等级、运行模式、风险等级）
  '反应塔时序参数.csv': generateIndustryData('PROC', PROCESS_FIELDS, 20, PROCESS_CLASSIFICATION_COLS),

  // 设备监控（含分类列：设备状态、告警等级、班次）
  '空压机健康监测.csv': generateIndustryData('EQUIP', EQUIP_FIELDS, 20, EQUIP_CLASSIFICATION_COLS),

  // 风电 SCADA（含分类列：风机状态、故障等级、运行模式）
  'C7.csv': generateIndustryData('WIND', WIND_FIELDS, 20, WIND_CLASSIFICATION_COLS),
  'C8.csv': generateIndustryData('WIND', WIND_FIELDS, 20, WIND_CLASSIFICATION_COLS),
  'C9.csv': generateIndustryData('WIND', WIND_FIELDS, 20, WIND_CLASSIFICATION_COLS),
  'C64.csv': generateIndustryData('WIND', WIND_FIELDS, 20, WIND_CLASSIFICATION_COLS),
  'C65.csv': generateIndustryData('WIND', WIND_FIELDS, 20, WIND_CLASSIFICATION_COLS),

  // 生产线传感器（含分类列：设备健康、告警等级）
  '生产线传感器1.csv': generateIndustryData('SENSE', SENSOR_FIELDS, 10, SENSOR_CLASSIFICATION_COLS),

  // 订单明细（已有分类列：status, region, payment_method）
  '订单明细.csv': [
    { order_id: 'ORD001', product_id: 'P100', quantity: 10, price: 99.9, customer_id: 'C001', status: '已完成', order_date: '2024-12-10', ship_date: '2024-12-12', region: '华东', sales_rep: '张三', payment_method: '支付宝', discount: 10, tax: 5, total_amount: 1004, notes: '' },
    { order_id: 'ORD002', product_id: 'P101', quantity: 5, price: 199.0, customer_id: 'C002', status: '待发货', order_date: '2024-12-11', ship_date: '', region: '华北', sales_rep: '李四', payment_method: '微信', discount: 0, tax: 10, total_amount: 1005, notes: '加急' },
    { order_id: 'ORD003', product_id: 'P102', quantity: 8, price: 149.5, customer_id: 'C003', status: '已取消', order_date: '2024-12-09', ship_date: '', region: '华南', sales_rep: '王五', payment_method: '银行卡', discount: 5, tax: 8, total_amount: 1200, notes: '' },
    { order_id: 'ORD004', product_id: 'P100', quantity: 12, price: 99.9, customer_id: 'C004', status: '已完成', order_date: '2024-12-08', ship_date: '2024-12-10', region: '西北', sales_rep: '张三', payment_method: '支付宝', discount: 15, tax: 6, total_amount: 1180, notes: '' },
    { order_id: 'ORD005', product_id: 'P103', quantity: 3, price: 299.0, customer_id: 'C005', status: '待发货', order_date: '2024-12-12', ship_date: '', region: '华东', sales_rep: '赵六', payment_method: '微信', discount: 0, tax: 9, total_amount: 906, notes: '优先处理' },
  ],
};

export default datasetPreviewRows;