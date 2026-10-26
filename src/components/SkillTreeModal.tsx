import React, { useState } from 'react';
import { X, Sparkles, Check, Lock, Shield, Zap, Wind, Crosshair, Feather, RefreshCw, Skull, Flame, Snowflake, Sun, Moon } from 'lucide-react';
import { canUnlockSkill, SKILL_TREE_NODES } from '../game/skillTree.ts';
import { SkillNode } from '../game/types.ts';
import { sounds } from '../game/soundEffects.ts';

interface SkillTreeModalProps {
  unlockedNodeIds: Set<string>;
  skillPoints: number;
  onUnlockSkill: (nodeId: string) => void;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  sword: <span className="text-base">⚔️</span>,
  shield: <Shield className="w-4 h-4 text-emerald-400" />,
  heart: <span className="text-base">🩸</span>,
  'refresh-cw': <RefreshCw className="w-4 h-4 text-amber-400" />,
  zap: <Zap className="w-4 h-4 text-yellow-400" />,
  wind: <Wind className="w-4 h-4 text-sky-400" />,
  crosshair: <Crosshair className="w-4 h-4 text-rose-400" />,
  feather: <Feather className="w-4 h-4 text-teal-400" />,
  'chevrons-right': <span className="text-base">🗡️</span>,
  skull: <Skull className="w-4 h-4 text-purple-400" />,
  sparkles: <Sparkles className="w-4 h-4 text-purple-300" />,
  flame: <Flame className="w-4 h-4 text-orange-400" />,
  snowflake: <Snowflake className="w-4 h-4 text-cyan-400" />,
  sun: <Sun className="w-4 h-4 text-yellow-300" />,
  moon: <Moon className="w-4 h-4 text-indigo-400" />,
};

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({
  unlockedNodeIds,
  skillPoints,
  onUnlockSkill,
  onClose,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<'vanguard' | 'shadowblade' | 'elementalist'>('vanguard');
  const [selectedNode, setSelectedNode] = useState<SkillNode>(SKILL_TREE_NODES[0]);

  const branchNodes = SKILL_TREE_NODES.filter((n) => n.branch === selectedBranch);

  const handleNodeClick = (node: SkillNode) => {
    setSelectedNode(node);
    sounds.playUiClick();
  };

  const handleUnlockClick = () => {
    const check = canUnlockSkill(selectedNode.id, unlockedNodeIds, skillPoints);
    if (check.allowed) {
      onUnlockSkill(selectedNode.id);
      sounds.playLevelUp();
    }
  };

  const isUnlocked = unlockedNodeIds.has(selectedNode.id);
  const unlockCheck = canUnlockSkill(selectedNode.id, unlockedNodeIds, skillPoints);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 pointer-events-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-lg font-bold font-mono tracking-wider text-slate-100">TALENT CONSTELLATION</h2>
              <p className="text-xs text-slate-400 font-mono">Specialized Archetype Masteries</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/50 border border-amber-600/60 text-amber-300 font-mono text-xs font-bold">
              <span>AVAILABLE POINTS:</span>
              <span className="text-sm text-amber-400">{skillPoints}</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close Skill Tree"
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Branch Selector Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-slate-900/40">
          <button
            onClick={() => {
              setSelectedBranch('vanguard');
              setSelectedNode(SKILL_TREE_NODES.find((n) => n.branch === 'vanguard')!);
              sounds.playUiClick();
            }}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-mono font-bold tracking-wider transition border-b-2 cursor-pointer ${
              selectedBranch === 'vanguard'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            VANGUARD (MIGHT & TANK)
          </button>
          <button
            onClick={() => {
              setSelectedBranch('shadowblade');
              setSelectedNode(SKILL_TREE_NODES.find((n) => n.branch === 'shadowblade')!);
              sounds.playUiClick();
            }}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-mono font-bold tracking-wider transition border-b-2 cursor-pointer ${
              selectedBranch === 'shadowblade'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            SHADOWBLADE (AGILITY & CRIT)
          </button>
          <button
            onClick={() => {
              setSelectedBranch('elementalist');
              setSelectedNode(SKILL_TREE_NODES.find((n) => n.branch === 'elementalist')!);
              sounds.playUiClick();
            }}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-mono font-bold tracking-wider transition border-b-2 cursor-pointer ${
              selectedBranch === 'elementalist'
                ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ELEMENTALIST (ARCANE & AOE)
          </button>
        </div>

        {/* Content Body: Tree Visualizer + Details Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
          {/* Tree Nodes Progression */}
          <div className="flex-1 p-6 flex flex-col items-center justify-around gap-4 min-h-[360px] bg-slate-950">
            {branchNodes.map((node, index) => {
              const unlocked = unlockedNodeIds.has(node.id);
              const isSelected = selectedNode.id === node.id;
              const canUnlock = canUnlockSkill(node.id, unlockedNodeIds, skillPoints).allowed;

              return (
                <div key={node.id} className="relative flex flex-col items-center w-full max-w-sm">
                  {/* Vertical connector line */}
                  {index > 0 && (
                    <div
                      className={`w-0.5 h-6 -mt-3 mb-1 ${
                        unlocked ? 'bg-amber-400' : 'bg-slate-800'
                      }`}
                    />
                  )}

                  <button
                    onClick={() => handleNodeClick(node)}
                    className={`w-full flex items-center justify-between p-3.5 border transition cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-slate-900 shadow-lg'
                        : unlocked
                        ? 'border-amber-500/60 bg-slate-900/70 text-amber-200'
                        : canUnlock
                        ? 'border-slate-600 bg-slate-950 hover:border-slate-400'
                        : 'border-slate-800/80 bg-slate-950/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 flex items-center justify-center border ${
                          unlocked
                            ? 'border-amber-400 bg-amber-950/40'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {ICON_MAP[node.icon] || <Zap className="w-4 h-4" />}
                      </div>

                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono tracking-wide">
                            {node.name}
                          </span>
                          {!node.isPassive && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-sky-950 border border-sky-600 text-sky-300">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono">Tier {node.tier}</span>
                      </div>
                    </div>

                    <div>
                      {unlocked ? (
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono font-bold">
                          <Check className="w-4 h-4" />
                          <span>LEARNED</span>
                        </div>
                      ) : canUnlock ? (
                        <span className="text-xs font-mono text-amber-400 font-bold">READY</span>
                      ) : (
                        <Lock className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right Detail Card */}
          <div className="w-full md:w-80 p-6 bg-slate-900/60 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber-400 font-bold uppercase">
                    {selectedNode.branch} · Tier {selectedNode.tier}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {selectedNode.isPassive ? 'Passive Mastery' : 'Active Hotbar Spell'}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-mono text-white mt-1">{selectedNode.name}</h3>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                {selectedNode.desc}
              </div>

              {/* Stat Modifiers */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Granted Attributes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(selectedNode.stats).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2 py-1 bg-slate-800 border border-slate-700 text-xs font-mono text-amber-300"
                    >
                      +{v} {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              {isUnlocked ? (
                <div className="w-full py-3 bg-emerald-950/40 border border-emerald-600/60 text-emerald-400 font-mono text-xs font-bold text-center tracking-wider">
                  MASTERY ACQUIRED
                </div>
              ) : (
                <button
                  onClick={handleUnlockClick}
                  disabled={!unlockCheck.allowed}
                  className={`w-full py-3 font-mono text-xs font-bold tracking-wider transition uppercase cursor-pointer ${
                    unlockCheck.allowed
                      ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  {unlockCheck.allowed ? 'UNLOCK TALENT (1 POINT)' : unlockCheck.reason || 'LOCKED'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
