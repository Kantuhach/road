export default function AlertToast({ message }) {
  return (
    <div className="toast-banner">
      <strong>Alert</strong>
      <span>{message}</span>
    </div>
  );
}
