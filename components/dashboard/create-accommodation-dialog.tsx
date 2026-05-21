"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, X } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { createAccommodation } from "@/lib/api/accommodations"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const createAccommodationSchema = z.object({
  title: z.string().min(1, "Título es requerido").max(100, "Máximo 100 caracteres"),
  description: z.string().min(1, "Descripción es requerida").max(1000, "Máximo 1000 caracteres"),
  capacity: z.coerce
    .number()
    .min(1, "Capacidad mínima de 1 huésped")
    .max(50, "Capacidad máxima de 50 huéspedes"),
  currency: z.string().length(3, "Código de moneda debe tener 3 caracteres").default("COP"),
  pricePerNight: z.string().refine((val) => !Number.isNaN(parseFloat(val)), "Debe ser un número válido"),
  mainImage: z.string().url("URL de imagen principal inválida"),
  longitude: z.coerce
    .number()
    .min(-180, "Longitud debe ser >= -180")
    .max(180, "Longitud debe ser <= 180"),
  latitude: z.coerce
    .number()
    .min(-90, "Latitud debe ser >= -90")
    .max(90, "Latitud debe ser <= 90"),
  locationDescription: z.string().min(1, "Descripción de ubicación es requerida").max(100, "Máximo 100 caracteres"),
  city: z.string().min(1, "Ciudad es requerida").max(100, "Máximo 100 caracteres"),
  images: z.array(z.string().url("Cada URL de imagen debe ser válida")).min(1, "Al menos una imagen es requerida"),
})

type CreateAccommodationFormValues = z.infer<typeof createAccommodationSchema>

interface CreateAccommodationDialogProps {
  onAccommodationCreated?: (accommodationId: number) => void
}

export function CreateAccommodationDialog({ onAccommodationCreated }: CreateAccommodationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState("")
  const { toast } = useToast()

  const form = useForm<CreateAccommodationFormValues>({
    resolver: zodResolver(createAccommodationSchema),
    defaultValues: {
      title: "",
      description: "",
      capacity: 1,
      currency: "COP",
      pricePerNight: "",
      mainImage: "",
      longitude: -75.5,
      latitude: 4.5,
      locationDescription: "",
      city: "",
      images: [],
    },
  })

  const onSubmit = useCallback(
    async (values: CreateAccommodationFormValues) => {
      setIsLoading(true)
      try {
        const result = await createAccommodation({
          ...values,
          images,
        })

        if (result.error) {
          toast({
            title: "Error al crear casa",
            description: result.error,
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        toast({
          title: "Casa creada exitosamente",
          description: `Casa "${result.data?.title}" ha sido creada.`,
        })

        if (result.data?.id) {
          onAccommodationCreated?.(result.data.id)
        }

        form.reset()
        setImages([])
        setNewImageUrl("")
        setOpen(false)
      } catch (error) {
        console.error("Error creating accommodation:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al crear la casa",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [form, images, onAccommodationCreated, toast]
  )

  const addImage = useCallback(() => {
    if (newImageUrl.trim() && !images.includes(newImageUrl)) {
      setImages([...images, newImageUrl])
      setNewImageUrl("")
    }
  }, [newImageUrl, images])

  const removeImage = useCallback((index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }, [images])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Casa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Casa</DialogTitle>
          <DialogDescription>Completa los detalles de tu nueva propiedad de alquiler</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. Cabaña con vista al valle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe la propiedad, comodidades, ambiente..."
                      className="resize-none h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Capacity and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidad (huéspedes)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <FormControl>
                      <Input placeholder="COP" maxLength={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Price per Night */}
            <FormField
              control={form.control}
              name="pricePerNight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio por noche</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="ej. 180000" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Main Image */}
            <FormField
              control={form.control}
              name="mainImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagen Principal (URL)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gallery Images */}
            <FormItem>
              <FormLabel>Galería de Imágenes</FormLabel>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())}
                  />
                  <Button type="button" variant="outline" onClick={addImage} disabled={!newImageUrl.trim()}>
                    Agregar
                  </Button>
                </div>

                {images.length > 0 && (
                  <div className="space-y-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 rounded bg-gray-100 p-2 text-sm">
                        <span className="truncate">{img}</span>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {images.length === 0 && <p className="text-sm text-red-500">Al menos una imagen es requerida</p>}
            </FormItem>

            {/* Location Description */}
            <FormField
              control={form.control}
              name="locationDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción de Ubicación</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. A 10 min del Parque del Café, sobre vía principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. Armenia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitud</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" placeholder="-75.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitud</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" placeholder="4.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading || images.length === 0}>
                {isLoading ? "Creando..." : "Crear Casa"}
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
