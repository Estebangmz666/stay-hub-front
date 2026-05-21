"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { createRentalPackage } from "@/lib/api/rental-packages"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const createPackageSchema = z.object({
  startDate: z.string().min(1, "Fecha de inicio es requerida"),
  endDate: z.string().min(1, "Fecha de fin es requerida"),
  pricePerNight: z.string().refine((val) => !Number.isNaN(parseFloat(val)), "Debe ser un número válido"),
})

type CreatePackageFormValues = z.infer<typeof createPackageSchema>

interface CreateRentalPackageDialogProps {
  accommodationId: number
  onPackageCreated?: () => void
}

export function CreateRentalPackageDialog({ accommodationId, onPackageCreated }: CreateRentalPackageDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<CreatePackageFormValues>({
    resolver: zodResolver(createPackageSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      pricePerNight: "",
    },
  })

  const onSubmit = useCallback(
    async (values: CreatePackageFormValues) => {
      // Validate that endDate > startDate
      if (new Date(values.endDate) <= new Date(values.startDate)) {
        toast({
          title: "Fecha inválida",
          description: "La fecha de fin debe ser posterior a la fecha de inicio",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        const result = await createRentalPackage(accommodationId, {
          startDate: values.startDate,
          endDate: values.endDate,
          pricePerNight: values.pricePerNight,
        })

        if (result.error) {
          toast({
            title: "Error al crear paquete",
            description: result.error,
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        toast({
          title: "Paquete creado exitosamente",
          description: `Paquete desde ${values.startDate} hasta ${values.endDate}`,
        })

        form.reset()
        onPackageCreated?.()
        setOpen(false)
      } catch (error) {
        console.error("Error creating package:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al crear el paquete",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [accommodationId, onPackageCreated, toast]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Paquete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Paquete</DialogTitle>
          <DialogDescription>Establece un precio especial para un período específico</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Inicio</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Fin</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricePerNight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio por Noche</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ej. 220000" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear Paquete"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
