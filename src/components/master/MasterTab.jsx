import React from 'react';
import { Anchor, Video, User, Cpu, Layers, Droplet, Clock } from 'lucide-react';
import { CageManagement } from './CageManagement';
import { CameraManagement } from './CameraManagement';
import { OperatorManagement } from './OperatorManagement';
import { GatewayManagement } from './GatewayManagement';
import { NodeManagement } from './NodeManagement';
import { SensorTypeManagement } from './SensorTypeManagement';

export const MasterTab = ({
  masterSubTab,
  setMasterSubTab,
  cagesList,
  camerasList,
  operatorsList,
  edgeGatewaysList,
  iotNodesMasterList,
  sensorTypesList,
  citiesList,
  loadingCages,
  loadingCameras,
  loadingOperators,
  loadingEdgeGateways,
  loadingIotNodesMaster,
  loadingSensorTypes,
  onAddCage,
  onDeleteCage,
  onAddCamera,
  onDeleteCamera,
  onAddOperator,
  onDeleteOperator,
  onAddEdgeGateway,
  onDeleteEdgeGateway,
  onAddIotNodeMaster,
  onDeleteIotNodeMaster,
  onRefreshCages,
  onRefreshCameras,
  onRefreshOperators,
  onRefreshGateways,
  onRefreshNodes,
  onRefreshSensorTypes,
  onRedirectToFeeding,
  
  // Threshold configs
  thresholdsList,
  loadingThresholds,
  onUpdateThresholds,
  setThresholdsList
}) => {

  const subTabs = [
    { id: 'edge_computing', label: 'Edge Gateway', icon: Cpu },
    { id: 'iot_node',       label: 'IoT Node',      icon: Layers },
    { id: 'sensor',         label: 'Tipe Sensor',   icon: Droplet },
    { id: 'cages',          label: 'Keramba (KJA)',  icon: Anchor },
    { id: 'cameras',        label: 'Kamera CCTV',   icon: Video },
    { id: 'operators',      label: 'Operator',      icon: User },
  ];

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Manajemen Data Master</h1>
        <p className="text-xs text-slate-500 mt-1">Kelola data keramba, kamera pengawas, dan operator lapangan terdaftar.</p>
      </div>

      {/* Sub-navigation pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3" id="master-sub-nav">
        {subTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMasterSubTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              masterSubTab === id
                ? 'bg-[#0D9D1B] text-white shadow-sm shadow-green-500/10'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Render sub components */}
      <div id="master-sub-tab-content">
        {masterSubTab === 'cages' && (
          <CageManagement
            cagesList={cagesList}
            loadingCages={loadingCages}
            onAddCage={onAddCage}
            onDeleteCage={onDeleteCage}
            onRefresh={onRefreshCages}
          />
        )}

        {masterSubTab === 'cameras' && (
          <CameraManagement
            camerasList={camerasList}
            cagesList={cagesList}
            loadingCameras={loadingCameras}
            onAddCamera={onAddCamera}
            onDeleteCamera={onDeleteCamera}
            onRefresh={onRefreshCameras}
          />
        )}

        {masterSubTab === 'operators' && (
          <OperatorManagement
            operatorsList={operatorsList}
            loadingOperators={loadingOperators}
            onAddOperator={onAddOperator}
            onDeleteOperator={onDeleteOperator}
            onRefresh={onRefreshOperators}
          />
        )}

        {masterSubTab === 'edge_computing' && (
          <GatewayManagement
            edgeGatewaysList={edgeGatewaysList}
            citiesList={citiesList}
            loadingEdgeGateways={loadingEdgeGateways}
            onAddEdgeGateway={onAddEdgeGateway}
            onDeleteEdgeGateway={onDeleteEdgeGateway}
            onRefresh={onRefreshGateways}
          />
        )}

        {masterSubTab === 'iot_node' && (
          <NodeManagement
            iotNodesMasterList={iotNodesMasterList}
            edgeGatewaysList={edgeGatewaysList}
            citiesList={citiesList}
            loadingIotNodesMaster={loadingIotNodesMaster}
            onAddIotNodeMaster={onAddIotNodeMaster}
            onDeleteIotNodeMaster={onDeleteIotNodeMaster}
            onRefresh={onRefreshNodes}
          />
        )}

        {masterSubTab === 'sensor' && (
          <SensorTypeManagement
            sensorTypesList={sensorTypesList}
            loadingSensorTypes={loadingSensorTypes}
            onRefresh={onRefreshSensorTypes}
            thresholdsList={thresholdsList}
            loadingThresholds={loadingThresholds}
            onUpdateThresholds={onUpdateThresholds}
            setThresholdsList={setThresholdsList}
          />
        )}
      </div>

    </div>
  );
};
