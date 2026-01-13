import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { UserProfile } from "@/shared/types/user.types"
import { usersService } from "../services/users.service"
import { toast } from "sonner"

const formSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(['loan_executive', 'supervisor', 'administrator', 'legal', 'commercial', 'closer', 'appraisal_manager', 'investment_executive']),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").or(z.literal("")).optional(),
})

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userToEdit?: UserProfile | null
  onSuccess: () => void
}

export function UserDialog({ open, onOpenChange, userToEdit, onSuccess }: UserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!userToEdit

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      role: "loan_executive",
    },
    values: userToEdit ? {
        displayName: userToEdit.displayName || "",
        email: userToEdit.email,
        password: "", // Password not editable directly here
        role: userToEdit.role
    } : undefined
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
        if (isEditing && userToEdit) {
            await usersService.update(userToEdit.uid, {
                displayName: values.displayName,
                role: values.role
            })
        } else {
            if (!values.password) {
                form.setError("password", { message: "La contraseña es requerida para nuevos usuarios" })
                return
            }
            await usersService.create({
                email: values.email,
                password: values.password,
                displayName: values.displayName,
                role: values.role
            })
        }
        toast.success(isEditing ? "Usuario actualizado exitosamente" : "Usuario creado exitosamente")
        onSuccess()
        onOpenChange(false)
        form.reset()
    } catch (error: any) {
        console.error(error)
        toast.error("Error al guardar: " + (error.message || "Error desconocido"))
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos del usuario." : "Crea un nuevo usuario para el sistema."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="usuario@intercapital.com" {...field} disabled={isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditing && (
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                        <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                      <SelectContent>
                        <SelectItem value="administrator">Administrator</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="loan_executive">Ejecutivo de Préstamos</SelectItem>
                        <SelectItem value="investment_executive">Ejecutivo de Inversiones</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="closer">Closer</SelectItem>
                        <SelectItem value="appraisal_manager">Gestor de Tasación</SelectItem>
                      </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
