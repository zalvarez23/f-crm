import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UsersTable } from "../components/users-table"
import { UserDialog } from "../components/user-dialog"
import { usersService } from "../services/users.service"
import type { UserProfile } from "@/shared/types/user.types"
import { toast } from "sonner"

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await usersService.getAll()
      setUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateUser = () => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  const handleDeleteUser = async (uid: string) => {
    if (!confirm("¿Está seguro de eliminar este usuario?")) return
    try {
      await usersService.delete(uid)
      toast.success("Usuario eliminado exitosamente")
      loadUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Error al eliminar usuario")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        </div>
        <Button onClick={handleCreateUser}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando usuarios...</div>
      ) : (
        <UsersTable users={users} onEdit={handleEditUser} onDelete={handleDeleteUser} />
      )}

      <UserDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        userToEdit={editingUser}
        onSuccess={() => {
          loadUsers()
          setIsDialogOpen(false)
        }}
      />
    </div>
  )
}
