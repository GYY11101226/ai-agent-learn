export default function ErrorView({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="state error">
      <p>加载失败：{message}</p>
      {onRetry && <button onClick={onRetry}>重试</button>}
    </div>
  )
}