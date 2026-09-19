import type { ComponentType } from 'react'
import BackpropAnimation from './BackpropAnimation'
import BuildCacheAnimation from './BuildCacheAnimation'
import CacheAnimation from './CacheAnimation'
import ConvolutionAnimation from './ConvolutionAnimation'
import DecisionTreeAnimation from './DecisionTreeAnimation'
import GradientDescentAnimation from './GradientDescentAnimation'
import ImageLayersAnimation from './ImageLayersAnimation'
import LoadBalancingAnimation from './LoadBalancingAnimation'
import PortMappingAnimation from './PortMappingAnimation'
import ReverseProxyAnimation from './ReverseProxyAnimation'
import TlsHandshakeAnimation from './TlsHandshakeAnimation'
import VolumeAnimation from './VolumeAnimation'
import WorkflowNodeFlowAnimation from './WorkflowNodeFlowAnimation'
import WorkflowVsChatflowAnimation from './WorkflowVsChatflowAnimation'
import ApiEmbedAnimation from './ApiEmbedAnimation'
import StreamingSseAnimation from './StreamingSseAnimation'
import AgenticLoopAnimation from './AgenticLoopAnimation'
import ToolRoundtripAnimation from './ToolRoundtripAnimation'
import PermissionFlowAnimation from './PermissionFlowAnimation'
import SubagentParallelAnimation from './SubagentParallelAnimation'
import StateRenderAnimation from './StateRenderAnimation'
import PropsFlowAnimation from './PropsFlowAnimation'
import EffectTimelineAnimation from './EffectTimelineAnimation'
import ReconciliationAnimation from './ReconciliationAnimation'

// chapter.animation 枚举 → 动画组件。未注册的值静默不渲染（向后兼容）。
const ANIMATIONS: Record<string, ComponentType> = {
  'gradient-descent': GradientDescentAnimation,
  backprop: BackpropAnimation,
  convolution: ConvolutionAnimation,
  'decision-tree': DecisionTreeAnimation,
  'image-layers': ImageLayersAnimation,
  'build-cache': BuildCacheAnimation,
  'port-mapping': PortMappingAnimation,
  volume: VolumeAnimation,
  'reverse-proxy': ReverseProxyAnimation,
  'load-balancing': LoadBalancingAnimation,
  cache: CacheAnimation,
  'tls-handshake': TlsHandshakeAnimation,
  'workflow-node-flow': WorkflowNodeFlowAnimation,
  'workflow-vs-chatflow': WorkflowVsChatflowAnimation,
  'api-embed': ApiEmbedAnimation,
  'streaming-sse': StreamingSseAnimation,
  'agentic-loop': AgenticLoopAnimation,
  'tool-roundtrip': ToolRoundtripAnimation,
  'permission-flow': PermissionFlowAnimation,
  'subagent-parallel': SubagentParallelAnimation,
  'state-render': StateRenderAnimation,
  'props-flow': PropsFlowAnimation,
  'effect-timeline': EffectTimelineAnimation,
  reconciliation: ReconciliationAnimation,
}

export default function AnimationHost({ kind }: { kind: string }) {
  const Cmp = ANIMATIONS[kind]
  if (!Cmp) return null
  return <Cmp />
}

export function hasAnimation(kind: string): boolean {
  return kind in ANIMATIONS
}
