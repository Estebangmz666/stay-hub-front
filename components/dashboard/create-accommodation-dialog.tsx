"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Upload, X } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { createAccommodation } from "@/lib/api/accommodations"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const createHouseSchema = z.object({
  title: z.string().min(1, "Título es requerido").max(100, "Máximo 100 caracteres"),
  description: z.string().min(1, "Descripción es requerida").max(1000, "Máximo 1000 caracteres"),
  capacity: z.coerce
    .number()
    .min(1, "Capacidad mínima de 1 huésped")
    .max(50, "Capacidad máxima de 50 huéspedes"),
  currency: z.string().length(3, "Debe ser 3 caracteres").default("COP"),
  pricePerNight: z.coerce
    .number()
    .gt(0, "Debe ser un número mayor que 0"),
  longitude: z.coerce
    .number()
    .min(-180, "Longitud debe ser mayor o igual a -180")
    .max(180, "Longitud debe ser menor o igual a 180"),
  latitude: z.coerce
    .number()
    .min(-90, "Latitud debe ser mayor o igual a -90")
    .max(90, "Latitud debe ser menor o igual a 90"),
  locationDescription: z.string().min(1, "Requerida").max(100, "Máximo 100 caracteres"),
  city: z.string().min(1, "Requerida").max(100, "Máximo 100 caracteres"),
})

type CreateHouseFormValues = z.infer<typeof createHouseSchema>

interface CreateHouseFormProps {
  onCreated?: () => void
}

export function CreateHouseForm({ onCreated }: CreateHouseFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [galleryImages, setGalleryImages] = useState<File[]>([])
  const { toast } = useToast()

  const form = useForm<CreateHouseFormValues>({
    resolver: zodResolver(createHouseSchema),
    defaultValues: {
      title: "",
      description: "",
      capacity: 2,
      currency: "COP",
      pricePerNight: 0,
      longitude: 0,
      latitude: 0,
      locationDescription: "",
      city: "",
    },
  })

  const convertFileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error("Error al leer archivo"))
    })
  }

  const onSubmit = useCallback(
    async (values: CreateHouseFormValues) => {
      if (!mainImage) {
        toast({
          title: "Imagen faltante",
          description: "Selecciona una imagen principal",
          variant: "destructive",
        })
        return
      }

      if (galleryImages.length === 0) {
        toast({
          title: "Galería vacía",
          description: "Añade al menos una imagen a la galería",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        const mainImageBase64 = await convertFileToBase64(mainImage)
        const galleryBase64 = await Promise.all(galleryImages.map(convertFileToBase64))

        const result = await createAccommodation({
          ...values,
          mainImage: mainImageBase64,
          images: galleryBase64,
        })

        if (result.error) {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          })
          return
        }

        toast({
          title: "¡Casa creada!",
          description: `"${result.data?.title}" está lista`,
        })

        form.reset()
        setMainImage(null)
        setGalleryImages([])
        onCreated?.()
      } catch (error) {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: "No se pudo crear la casa",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [form, mainImage, galleryImages, toast, onCreated]
  )

  const handleMainImageSelect = useCallback((file: File | null) => {
    if (file?.type.startsWith("image/")) {
      setMainImage(file)
    } else if (file) {
      toast({
        title: "Archivo inválido",
        description: "Solo se aceptan imágenes",
        variant: "destructive",
      })
    }
  }, [toast])

  const handleGalleryImageAdd = useCallback((file: File | null) => {
    if (!file) return
    if (galleryImages.length >= 5) {
      toast({
        title: "Límite alcanzado",
        description: "Máximo 5 imágenes en galería",
        variant: "destructive",
      })
      return
    }
    if (file.type.startsWith("image/")) {
      setGalleryImages([...galleryImages, file])
    } else {
      toast({
        title: "Archivo inválido",
        description: "Solo se aceptan imágenes",
        variant: "destructive",
      })
    }
  }, [galleryImages, toast])

  const removeGalleryImage = useCallback((index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index))
  }, [galleryImages])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nueva Casa</CardTitle>
        <CardDescription>Añade una nueva propiedad a tu inventario</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Cabaña en el valle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe tu propiedad..." className="resize-none h-20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Armenia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitud</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" min="-180" max="180" {...field} />
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
                          <Input type="number" step="0.0001" min="-90" max="90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="locationDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <Input placeholder="Cerca al Parque del Café" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidad</FormLabel>
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
                          <Input maxLength={3} {...field} />
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
                        <FormLabel>Precio/noche</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Main Image */}
                <div>
                  <FormLabel className="mb-2 block">Imagen Principal</FormLabel>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleMainImageSelect(e.target.files?.[0] || null)}
                      className="hidden"
                      id="mainImage"
                    />
                    <label htmlFor="mainImage" className="cursor-pointer block">
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                      {mainImage ? (
                        <p className="text-xs font-medium text-green-600">{mainImage.name}</p>
                      ) : (
                        <p className="text-xs">Click para subir</p>
                      )}
                    </label>
                  </div>
                </div>

                {/* Gallery Images */}
                <div>
                  <FormLabel className="mb-2 block">Galería ({galleryImages.length}/5)</FormLabel>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleGalleryImageAdd(e.target.files?.[0] || null)}
                      className="hidden"
                      id="galleryImage"
                      disabled={galleryImages.length >= 5}
                    />
                    <label htmlFor="galleryImage" className="cursor-pointer block">
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs">Añadir imagen</p>
                    </label>
                  </div>

                  {galleryImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {galleryImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`Gallery ${idx}`}
                            className="w-full h-16 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !mainImage || galleryImages.length === 0}
            >
              {isLoading ? "Creando..." : "Crear Casa"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

