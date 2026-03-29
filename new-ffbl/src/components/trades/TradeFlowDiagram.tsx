// src/components/trades/TradeFlowDiagram.tsx
"use client";

import { useMemo } from 'react';
import { ReactFlow, Background, MarkerType, Node, Edge, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { UIAsset } from './TradeBuilder';

interface Props {
  tradeAssetsList: UIAsset[];
  involvedTeamIds: string[];
  getTeamName: (id: string) => string;
}

// A vibrant palette for team color coding
const TEAM_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
];

export default function TradeFlowDiagram({ tradeAssetsList, involvedTeamIds, getTeamName }: Props) {

  const { nodes, edges } = useMemo(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // --- 1. Calculate Asset Counts & Assign Colors ---
    const outgoingCounts: Record<string, number> = {};
    const incomingCounts: Record<string, number> = {};
    const teamColorMap: Record<string, string> = {};

    involvedTeamIds.forEach(id => {
      outgoingCounts[id] = 0;
      incomingCounts[id] = 0;
    });

    tradeAssetsList.forEach(asset => {
      const toTeamId = asset.currentZone.replace('trade-block-', '');
      outgoingCounts[asset.sourceTeamId] += 1;
      incomingCounts[toTeamId] += 1;
    });

    const sendingTeams = involvedTeamIds.filter(id => outgoingCounts[id] > 0);
    const receivingTeams = involvedTeamIds.filter(id => incomingCounts[id] > 0);

    // Assign a unique color to each receiving team for tracing
    receivingTeams.forEach((teamId, index) => {
      teamColorMap[teamId] = TEAM_COLORS[index % TEAM_COLORS.length];
    });

    // --- 2. Layout Configuration ---
    const colLeftX = 50;
    const colMidX = 400;
    const colRightX = 750;

    const assetSpacing = 65; // Slightly more breathing room
    const teamSpacing = 160;

    const totalAssetHeight = (tradeAssetsList.length - 1) * assetSpacing;
    const totalSendHeight = (sendingTeams.length - 1) * teamSpacing;
    const totalRecvHeight = (receivingTeams.length - 1) * teamSpacing;

    const centerY = Math.max(totalAssetHeight, totalSendHeight, totalRecvHeight) / 2 + 100;

    // --- 3. Create Left Nodes (Sending Teams) ---
    sendingTeams.forEach((teamId, index) => {
      const startY = centerY - (totalSendHeight / 2);
      const y = startY + (index * teamSpacing);

      newNodes.push({
        id: `team-send-${teamId}`,
        position: { x: colLeftX, y },
        sourcePosition: Position.Right,
        targetPosition: Position.Right, 
        data: {
          label: (
            <div className="flex flex-col items-center">
              <span className="font-bold text-sm">{getTeamName(teamId)}</span>
              <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">
                Sending: {outgoingCounts[teamId]}
              </span>
            </div>
          )
        },
        style: {
          background: '#1e293b', 
          color: 'white',
          border: '2px solid #334155', // Neutral border for senders
          borderRadius: '0.5rem',
          width: 180,
          padding: '12px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        },
      });
    });

    // --- 4. Create Right Nodes (Receiving Teams) ---
    receivingTeams.forEach((teamId, index) => {
      const startY = centerY - (totalRecvHeight / 2);
      const y = startY + (index * teamSpacing);
      const teamColor = teamColorMap[teamId];

      newNodes.push({
        id: `team-recv-${teamId}`,
        position: { x: colRightX, y },
        sourcePosition: Position.Left, 
        targetPosition: Position.Left,
        data: {
          label: (
            <div className="flex flex-col items-center">
              <span className="font-bold text-sm">{getTeamName(teamId)}</span>
              <span className="text-[10px] font-bold mt-1 uppercase tracking-wider" style={{ color: teamColor }}>
                Receiving: {incomingCounts[teamId]}
              </span>
            </div>
          )
        },
        style: {
          background: '#1e293b',
          color: 'white',
          border: `2px solid ${teamColor}`, // Colored border to match incoming lines!
          borderRadius: '0.5rem',
          width: 180,
          padding: '12px',
          boxShadow: `0 4px 15px -3px ${teamColor}40`, // Subtle colored glow
        },
      });
    });

    // --- 5. Create Middle Nodes (Assets) and Edges ---
    const startAssetY = centerY - (totalAssetHeight / 2);

    tradeAssetsList.forEach((asset, index) => {
      const y = startAssetY + (index * assetSpacing);
      const assetId = `asset-${asset.id}`;
      const isPlayer = asset.type === 'PLAYER';
      const toTeamId = asset.currentZone.replace('trade-block-', '');
      const recvColor = teamColorMap[toTeamId];

      newNodes.push({
        id: assetId,
        position: { x: colMidX, y },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: `${isPlayer ? '👤' : '🎫'} ${asset.name}` },
        style: {
          background: isPlayer ? '#eff6ff' : '#f0fdf4',
          color: isPlayer ? '#1e40af' : '#166534',
          border: `1px solid ${isPlayer ? '#bfdbfe' : '#bbf7d0'}`,
          borderRadius: '9999px',
          fontSize: '13px',
          fontWeight: '600',
          width: 220,
          textAlign: 'center',
          padding: '8px',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        },
      });

      // Edge 1: Sending Team -> Asset (Kept neutral/gray to focus on destination)
      newEdges.push({
        id: `edge-out-${asset.id}`,
        source: `team-send-${asset.sourceTeamId}`,
        target: assetId,
        type: 'default', // Sweeping Bezier curve
        animated: true,
        style: { stroke: '#cbd5e1', strokeWidth: 1.5 }, // Lighter slate
      });

      // Edge 2: Asset -> Receiving Team (Colored to match the team!)
      newEdges.push({
        id: `edge-in-${asset.id}`,
        source: assetId,
        target: `team-recv-${toTeamId}`,
        type: 'default', // Sweeping Bezier curve
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: recvColor, width: 20, height: 20 },
        style: { stroke: recvColor, strokeWidth: 3 }, // Thicker, vibrant line
      });
    });

    return { nodes: newNodes, edges: newEdges };
  }, [tradeAssetsList, involvedTeamIds, getTeamName]);

  return (
    <div className="w-full h-[600px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner cursor-grab active:cursor-grabbing">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll={true}
        panOnDrag={true}
      >
        <Background color="#e2e8f0" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}