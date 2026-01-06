/**
 * 共享的前端原型数据源：数据集列表。
 * 目的：在不同页面/新标签页之间保持数据一致性。
 * 说明：字段与 DataManagement 中使用的结构保持一致，便于直接展示。
 */

export interface DatasetFileVersion {
  version: string;
  files: Array<{
    name: string;
    size: string;
    rows: number;
    columns: number;
    fields: string[];
  }>;
}

export interface MockDataset {
  id: number;
  title: string;
  description: string;
  projectId: string; // 关联项目 ID
  categories: Array<{ name: string; color: string }>;
  tags: Array<{ name: string; color: string }>;
  formats: string[];
  size: string;
  rows: string;
  columns: string;
  completeness: number;
  source: string;
  version: string;
  versionCount?: number;
  fileCount?: number;
  updateTime: string;
  status: 'success' | 'processing' | 'failed';
  color: string;
  type?: string;
  fieldCount?: number;
  sampleCount?: number;
  versions?: DatasetFileVersion[]; // 详细版本文件信息
}

/**
 * 返回指定 ID 的数据集，未找到则返回 undefined。
 */
export function getDatasetById(id: number): MockDataset | undefined {
  return mockDatasets.find(d => d.id === id);
}

/**
 * 根据项目 ID 获取数据集列表
 */
export function getDatasetsByProjectId(projectId: string): MockDataset[] {
  return mockDatasets.filter(d => d.projectId === projectId);
}

/**
 * 原型数据初始列表
 */
const initialDatasets: MockDataset[] = [
  {
    id: 1,
    title: "冷轧板生产质量数据",
    description: "钢铁冷轧生产线实时采集的工艺参数，包含轧制力、张力、速度及各段温度等核心指标，用于表面缺陷识别与质量追溯。",
    projectId: "proj_001",
    categories: [
      { name: "钢铁", color: "bg-gray-100 text-gray-800" },
      { name: "制造", color: "bg-blue-100 text-blue-800" }
    ],
    tags: [
      { name: "高维数据", color: "bg-indigo-100 text-indigo-800" },
      { name: "生产监控", color: "bg-green-100 text-green-800" }
    ],
    formats: ["CSV"],
    size: "15.8MB",
    rows: "4,129",
    columns: "61",
    completeness: 98,
    source: "MES系统",
    version: "v1.0",
    versionCount: 1,
    fileCount: 1,
    updateTime: "2025-01-02 09:00",
    status: 'success',
    color: "border-l-slate-500",
    versions: [
      {
        version: "v1.0",
        files: [
          { name: "冷轧生产参数_2024.csv", size: "3.2MB", rows: 4129, columns: 61, fields: ["datatime", "Rolling_Force", "Rolling_Speed", "Entry_Tension", "Exit_Tension", "Motor_Current", "Motor_Voltage", "Coolant_Pressure", "Coolant_Temp", "Strip_Thickness", "Strip_Width", "Work_Roll_Gap", "Leveller_Current", "Coiler_Tension", "Uncoiler_Tension", "Edge_Temp_L", "Edge_Temp_R", "Center_Temp", "Vibration_Level", "Lubrication_Flow", "Strip_Speed_Exit", "Load_Cell_LC1", "Load_Cell_LC2", "Drive_Torque", "Brake_Pressure"] }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "化工炼化过程监测",
    projectId: "proj_003",
    description: "炼化塔运行过程中的关键物理化学指标，涵盖压力、流量、多点温度及催化剂活性指标。",
    categories: [
      { name: "工艺", color: "bg-purple-100 text-purple-800" },
      { name: "时序", color: "bg-orange-100 text-orange-800" }
    ],
    tags: [
      { name: "过程监控", color: "bg-gray-100 text-gray-800" }
    ],
    formats: ["CSV"],
    size: "8.4MB",
    rows: "4,129",
    columns: "61",
    completeness: 95,
    source: "DCS控制系统",
    version: "v2.1",
    versionCount: 1,
    fileCount: 1,
    updateTime: "2025-01-04 14:20",
    status: 'success',
    color: "border-l-purple-500",
    versions: [
      {
        version: "v2.1",
        files: [
          { name: "反应塔时序参数.csv", size: "2.1MB", rows: 4129, columns: 61, fields: ["datatime", "Tower_Pressure", "Top_Temp", "Middle_Temp", "Bottom_Temp", "Feed_Flow", "Reflux_Ratio", "Steam_Flow", "Product_Purity", "Catalyst_Level", "Cooling_Water_In", "Cooling_Water_Out", "Exchanger_DP", "Pump_Frequency", "Valve_Opening", "Ambient_Temp", "Heater_Current", "Heater_Voltage", "O2_Concentration", "CO_Concentration", "Viscosity_Index", "Density_Sensor", "Flow_Meter_1", "Flow_Meter_2", "Level_Indicator"] }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "核心设备健康状态监控",
    projectId: "proj_004",
    description: "针对压缩机、电机等关键旋转设备的振动频谱、轴承温度与润滑压力的多维度监控数据集。",
    categories: [
      { name: "设备", color: "bg-emerald-100 text-emerald-800" },
      { name: "故障诊断", color: "bg-red-100 text-red-800" }
    ],
    tags: [
      { name: "PHM", color: "bg-gray-100 text-gray-800" }
    ],
    formats: ["CSV"],
    size: "12.1MB",
    rows: "4,129",
    columns: "61",
    completeness: 85,
    source: "CMS系统",
    version: "v1.0",
    versionCount: 1,
    fileCount: 1,
    updateTime: "2024-12-20 18:20",
    status: 'success',
    color: "border-l-green-500",
    versions: [
      {
        version: "v1.0",
        files: [
          { name: "空压机健康监测.csv", size: "4.5MB", rows: 4129, columns: 61, fields: ["datatime", "Vibration_RMS", "Vibration_Peak", "Bearing_Temp_DE", "Bearing_Temp_NDE", "Winding_Temp_U", "Winding_Temp_V", "Winding_Temp_W", "Oil_Pressure", "Oil_Temp", "Inlet_Filter_DP", "Discharge_Temp", "Discharge_Pressure", "Motor_Speed", "Input_Current", "Input_Voltage", "Power_Factor", "Active_Power", "Reactive_Power", "Ambient_Humidity", "Cooler_Fan_Status", "Running_Hours", "Starts_Count", "Load_Cycle", "Unload_Cycle"] }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "风电场运行监控数据",
    projectId: "proj_002",
    description: "包含 28 个风电机组的实时运行监控数据，覆盖功率、转矩、振动及各部件温度等 60 余项核心指标。",
    categories: [
      { name: "工业", color: "bg-blue-100 text-blue-800" },
      { name: "能源", color: "bg-orange-100 text-orange-800" }
    ],
    tags: [
      { name: "风电", color: "bg-green-100 text-green-800" },
      { name: "传感器", color: "bg-blue-100 text-blue-800" }
    ],
    formats: ["CSV"],
    size: "68.5MB",
    rows: "4,129",
    columns: "61",
    completeness: 99,
    source: "风机SCADA系统",
    version: "v1.0",
    versionCount: 1,
    fileCount: 28,
    updateTime: "2024-12-28 10:00",
    status: 'success',
    color: "border-l-indigo-500",
    versions: [
      {
        version: "v1.0",
        files: [
          "C64.csv", "C65.csv", "C7.csv", "C77.csv", "C78.csv", "C79.csv", "C8.csv", "C80.csv",
          "C81.csv", "C82.csv", "C83.csv", "C84.csv", "C85.csv", "C86.csv", "C87.csv", "C88.csv",
          "C89.csv", "C9.csv", "C90.csv", "C91.csv", "C92.csv", "C93.csv", "C94.csv", "C95.csv",
          "C96.csv", "C97.csv", "C98.csv", "C99.csv"
        ].map(name => ({
          name,
          size: "2.5MB",
          rows: 4129,
          columns: 61,
          fields: ["datatime", "WROT_TemAxis1Ctrl", "WROT_TemAxis2Ctrl", "WROT_TemAxis3Ctrl", "WROT_PtCapTemBl1", "WROT_PtCapTemBl2", "WROT_PtCapTemBl3", "WROT_TemB1Mot", "WROT_TemB2Mot", "WROT_TemB3Mot", "WROT_TemHub", "WROT_TemHub2", "WROT_TemHub3", "WROT_Pitch1CapHighVol", "WROT_Pitch2CapHighVol", "WROT_Pitch3CapHighVol", "WROT_CurBlade1Motor", "WROT_CurBlade2Motor", "WROT_CurBlade3Motor", "WROT_Blade1Position", "WROT_Blade2Position", "WROT_Blade3Position", "WROT_TemBlade1Inver", "WROT_TemBlade2Inver", "WROT_TemBlade3Inver", "WTRM_TemGeaOil", "WTRM_TemGeaMSDE", "WTRM_TemGeaZSDE", "WTRM_GBoxOilPmpP", "WTRM_TemGBoxOilE", "WCNV_GridPPower", "WCNV_GridQPower", "WWPP_APProduction", "WGEN_TemGenDriEnd", "WGEN_TemGenNonDE", "WGEN_TemGenStaU", "WGEN_TemGenStaV", "WGEN_TemGenStaW", "WGEN_TemGenStaU2", "WGEN_TemGenStaV2", "WGEN_TemGenStaW3", "WGEN_GenCoolAirTem", "WNAC_WindSpeed", "WNAC_WindDirection", "WNAC_TemOut", "WNAC_TemNacelleCab", "WNAC_TemNacelleCabOut", "WVIB_VibrationLFil", "WVIB_VibrationVFil", "WYAW_YawPosition", "WYAW_Brake_Pressure", "WTOW_TemTowerCab", "WTRM_RotorSpd", "WTRM_PowerStoreTRBS", "WTRM_TemMainBearing", "WTRM_TemMainBearing2", "WGEN_GenActivePW", "WGEN_GenReactivePW", "WGEN_GenSpd", "WGEN_Torque", "WGEN_TorqueSetpoint"]
        }))
      }
    ]
  }
];

// 缓存 Key
const STORAGE_KEY = 'limix_mock_datasets';

/**
 * 初始化并导出 mockDatasets
 * 优先从 localStorage 获取，实现原型演示中的持久化
 */
export const mockDatasets: MockDataset[] = (() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // 如果已保存的数据中没有 projectId 或 versions，则重置为 initialDatasets
      if (parsed.length > 0 && (!parsed[0].projectId || !parsed[0].versions)) {
        return [...initialDatasets];
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse saved datasets', e);
    }
  }
  return [...initialDatasets];
})();

/**
 * 向全局列表添加新数据集并持久化
 * @param dataset 新数据集对象
 */
export function addMockDataset(dataset: MockDataset) {
  mockDatasets.unshift(dataset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockDatasets));
  // 触发一个自定义事件，通知页面刷新数据
  window.dispatchEvent(new CustomEvent('datasets-updated'));
}

/**
 * 重置数据（原型测试用）
 */
export function resetMockDatasets() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}