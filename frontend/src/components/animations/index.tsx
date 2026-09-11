import type { ComponentType } from 'react'
import BackpropAnimation from './BackpropAnimation'
import ConvolutionAnimation from './ConvolutionAnimation'
import DecisionTreeAnimation from './DecisionTreeAnimation'
import GradientDescentAnimation from './GradientDescentAnimation'

// chapter.animation 枚举 → 动画组件。未注册的值静默不渲染（向后兼容）。
const ANIMATIONS: Record<string, ComponentType> = {
  'gradient-descent': GradientDescentAnimation,
  backprop: BackpropAnimation,
  convolution: ConvolutionAnimation,
  'decision-tree': DecisionTreeAnimation,
}

export default function AnimationHost({ kind }: { kind: string }) {
  const Cmp = ANIMATIONS[kind]
  if (!Cmp) return null
  return <Cmp />
}

export function hasAnimation(kind: string): boolean {
  return kind in ANIMATIONS
}
