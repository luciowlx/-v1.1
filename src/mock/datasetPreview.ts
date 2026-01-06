/**
 * 辅助函数：生成模拟行业数据
 * @param prefix 字段名前缀
 * @param cols 列数
 * @param rows 行数
 * @param seedData 基础数据模板
 */
function generateIndustryData(prefix: string, fields: string[], rows: number): any[] {
  return Array.from({ length: rows }).map((_, rIdx) => {
    const row: any = { datatime: `2025-01-04 10:${String(rIdx).padStart(2, '0')}:00` };
    fields.forEach((field, fIdx) => {
      if (field === 'datatime') return;
      // 生成随机但合理的物理数值
      const base = 40 + (fIdx % 5) * 10;
      row[field] = Number((base + Math.random() * 5 + Math.sin(rIdx) * 2).toFixed(2));
    });
    return row;
  });
}

const STEEL_FIELDS = ["datatime", "Rolling_Force", "Rolling_Speed", "Entry_Tension", "Exit_Tension", "Motor_Current", "Motor_Voltage", "Coolant_Pressure", "Coolant_Temp", "Strip_Thickness", "Strip_Width", "Work_Roll_Gap", "Leveller_Current", "Coiler_Tension", "Uncoiler_Tension", "Edge_Temp_L", "Edge_Temp_R", "Center_Temp", "Vibration_Level", "Lubrication_Flow", "Strip_Speed_Exit", "Load_Cell_LC1", "Load_Cell_LC2", "Drive_Torque", "Brake_Pressure"];
const PROCESS_FIELDS = ["datatime", "Tower_Pressure", "Top_Temp", "Middle_Temp", "Bottom_Temp", "Feed_Flow", "Reflux_Ratio", "Steam_Flow", "Product_Purity", "Catalyst_Level", "Cooling_Water_In", "Cooling_Water_Out", "Exchanger_DP", "Pump_Frequency", "Valve_Opening", "Ambient_Temp", "Heater_Current", "Heater_Voltage", "O2_Concentration", "CO_Concentration", "Viscosity_Index", "Density_Sensor", "Flow_Meter_1", "Flow_Meter_2", "Level_Indicator"];
const EQUIP_FIELDS = ["datatime", "Vibration_RMS", "Vibration_Peak", "Bearing_Temp_DE", "Bearing_Temp_NDE", "Winding_Temp_U", "Winding_Temp_V", "Winding_Temp_W", "Oil_Pressure", "Oil_Temp", "Inlet_Filter_DP", "Discharge_Temp", "Discharge_Pressure", "Motor_Speed", "Input_Current", "Input_Voltage", "Power_Factor", "Active_Power", "Reactive_Power", "Ambient_Humidity", "Cooler_Fan_Status", "Running_Hours", "Starts_Count", "Load_Cycle", "Unload_Cycle"];
const WIND_FIELDS = ["datatime", "WROT_TemAxis1Ctrl", "WROT_TemAxis2Ctrl", "WROT_TemAxis3Ctrl", "WROT_PtCapTemBl1", "WROT_PtCapTemBl2", "WROT_PtCapTemBl3", "WROT_TemB1Mot", "WROT_TemB2Mot", "WROT_TemB3Mot", "WROT_TemHub", "WROT_TemHub2", "WROT_TemHub3", "WROT_Pitch1CapHighVol", "WROT_Pitch2CapHighVol", "WROT_Pitch3CapHighVol", "WROT_CurBlade1Motor", "WROT_CurBlade2Motor", "WROT_CurBlade3Motor", "WROT_Blade1Position", "WROT_Blade2Position", "WROT_Blade3Position", "WROT_TemBlade1Inver", "WROT_TemBlade2Inver", "WROT_TemBlade3Inver", "WTRM_TemGeaOil", "WTRM_TemGeaMSDE", "WTRM_TemGeaZSDE", "WTRM_GBoxOilPmpP", "WTRM_TemGBoxOilE", "WCNV_GridPPower", "WCNV_GridQPower", "WWPP_APProduction", "WGEN_TemGenDriEnd", "WGEN_TemGenNonDE", "WGEN_TemGenStaU", "WGEN_TemGenStaV", "WGEN_TemGenStaW", "WGEN_TemGenStaU2", "WGEN_TemGenStaV2", "WGEN_TemGenStaW3", "WGEN_GenCoolAirTem", "WNAC_WindSpeed", "WNAC_WindDirection", "WNAC_TemOut", "WNAC_TemNacelleCab", "WNAC_TemNacelleCabOut", "WVIB_VibrationLFil", "WVIB_VibrationVFil", "WYAW_YawPosition", "WYAW_Brake_Pressure", "WTOW_TemTowerCab", "WTRM_RotorSpd", "WTRM_PowerStoreTRBS", "WTRM_TemMainBearing", "WTRM_TemMainBearing2", "WGEN_GenActivePW", "WGEN_GenReactivePW", "WGEN_GenSpd", "WGEN_Torque", "WGEN_TorqueSetpoint"];

export type PreviewRow = Record<string, any>;

export const datasetPreviewRows: Record<string, PreviewRow[]> = {
  // 钢铁冷轧
  '冷轧生产参数_2024.csv': generateIndustryData('STEEL', STEEL_FIELDS, 20),

  // 化工工艺
  '反应塔时序参数.csv': generateIndustryData('PROC', PROCESS_FIELDS, 20),

  // 设备监控
  '空压机健康监测.csv': generateIndustryData('EQUIP', EQUIP_FIELDS, 20),

  // 风电 SCADA (仅为 C7, C8, C9 生成演示数据，其余保持为空或复用)
  'C7.csv': generateIndustryData('WIND', WIND_FIELDS, 20),
  'C8.csv': generateIndustryData('WIND', WIND_FIELDS, 20),
  'C9.csv': generateIndustryData('WIND', WIND_FIELDS, 20),
  'C64.csv': generateIndustryData('WIND', WIND_FIELDS, 20),
  'C65.csv': generateIndustryData('WIND', WIND_FIELDS, 20),

  // 保留原有基础数据用于其他演示
  '生产线传感器1.csv': generateIndustryData('SENSE', ["datatime", "temperature", "humidity", "pressure", "vibration", "voltage", "current", "rpm", "torque", "power", "energy", "status_code"], 10),
  '订单明细.csv': [
    { order_id: 'ORD001', product_id: 'P100', quantity: 10, price: 99.9, customer_id: 'C001', status: '已完成', order_date: '2024-12-10', ship_date: '2024-12-12', region: '华东', sales_rep: '张三', payment_method: '支付宝', discount: 10, tax: 5, total_amount: 1004, notes: '' },
    { order_id: 'ORD002', product_id: 'P101', quantity: 5, price: 199.0, customer_id: 'C002', status: '待发货', order_date: '2024-12-11', ship_date: '', region: '华北', sales_rep: '李四', payment_method: '微信', discount: 0, tax: 10, total_amount: 1005, notes: '加急' },
  ],
};

export default datasetPreviewRows;