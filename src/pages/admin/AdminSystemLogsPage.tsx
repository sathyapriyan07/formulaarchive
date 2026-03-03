import Card from '../../components/ui/Card'

export default function AdminSystemLogsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-f1-red">System Logs</h1>
      <Card>
        <p className="text-sm text-gray-300">
          API import logs were removed with the import subsystem cleanup. This page remains available for future non-import system logs.
        </p>
      </Card>
    </div>
  )
}
