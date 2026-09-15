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
}

export default function AnimationHost({ kind }: { kind: string }) {
  const Cmp = ANIMATIONS[kind]
  if (!Cmp) return null
  return <Cmp />
}

export function hasAnimation(kind: string): boolean {
  return kind in ANIMATIONS
}
