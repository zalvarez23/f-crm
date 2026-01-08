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
import { leadsService } from "../services/leads.service"

const formSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  phone: z.string().min(6, "El teléfono es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  amount: z.string().optional(), // Input as string, convert to number
  assignedTo: z.string(),
  leadType: z.enum(['loan', 'investment']),
})

interface LeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  executives: UserProfile[]
  onSuccess: () => void
}

export function LeadDialog({ open, onOpenChange, executives, onSuccess }: LeadDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      amount: "",
      assignedTo: "random", // Default to random
      leadType: "loan",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
        const isRandom = values.assignedTo === "random"

        await leadsService.createLead({
            name: values.name,
            phone: values.phone,
            email: values.email || null,
            amount: values.amount ? Number(values.amount) : 0,
            status: 'nuevo',
            assignedTo: isRandom ? undefined : (values.assignedTo === 'unassigned' ? undefined : values.assignedTo),
            leadType: values.leadType,
            source: 'manual'
        }, isRandom ? 'random' : 'equitable')

        onSuccess()
        onOpenChange(false)
        form.reset()
    } catch (error) {
        console.error(error)
        alert("Error al crear el lead")
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Lead Manual</DialogTitle>
          <DialogDescription>
            Registra un nuevo lead individualmente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                        <Input placeholder="999888777" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{form.watch('leadType') === 'investment' ? 'Capital a Invertir' : 'Monto (S/)'}</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="10000" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="cliente@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="leadType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Lead</FormLabel>
                    <Select 
                        onValueChange={(val) => {
                            field.onChange(val)
                            form.setValue('assignedTo', 'random')
                        }} 
                        defaultValue={field.value}
                    >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar Tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="loan">Préstamos</SelectItem>
                      <SelectItem value="investment">Inversiones</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />


            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asignación</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar Asignación" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="random">🎲 Asignación Aleatoria</SelectItem>
                      <SelectItem value="unassigned">-- Sin Asignar --</SelectItem>
                      {executives
                        .filter(exec => form.watch('leadType') === 'loan' ? exec.role === 'loan_executive' : exec.role === 'investment_executive')
                        .map(exec => (
                        <SelectItem key={exec.uid} value={exec.uid}>
                          {exec.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Lead
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
