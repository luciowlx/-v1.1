import { ChevronRight, FolderPlus } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage } from "../i18n/LanguageContext";

export function Sidebar() {
  const { t } = useLanguage();
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">{t("project.sidebar.title")}</h2>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 mt-1">{t("project.sidebar.desc")}</p>
      </div>
      
      <div className="p-4">
        <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center space-x-2">
          <FolderPlus className="h-4 w-4" />
          <span>{t("project.sidebar.newProject")}</span>
        </Button>
        
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-500">{t("project.sidebar.analysisInfo")}</div>
          <div className="text-xs text-gray-400">{t("project.sidebar.analysisDesc")}</div>
        </div>
      </div>
    </div>
  );
}