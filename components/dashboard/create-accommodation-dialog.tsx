"use client"

import Image from "next/image"
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
  title: z.string().min(1, "Titulo es requerido").max(100, "Maximo 100 caracteres"),
  description: z.string().min(1, "Descripcion es requerida").max(1000, "Maximo 1000 caracteres"),
  capacity: z.coerce
    .number()
    .min(1, "Capacidad minima de 1 huesped")
    .max(50, "Capacidad maxima de 50 huespedes"),
  currency: z.string().length(3, "Debe ser 3 caracteres").default("COP"),
  pricePerNight: z.coerce
    .number()
    .gt(0, "Debe ser un numero mayor que 0"),
  longitude: z.coerce
    .number()
    .min(-180, "Longitud debe ser mayor o igual a -180")
    .max(180, "Longitud debe ser menor o igual a 180"),
  latitude: z.coerce
    .number()
    .min(-90, "Latitud debe ser mayor o igual a -90")
    .max(90, "Latitud debe ser menor o igual a 90"),
  locationDescription: z.string().min(1, "Requerida").max(100, "Maximo 100 caracteres"),
  city: z.string().min(1, "Requerida").max(100, "Maximo 100 caracteres"),
})

type CreateHouseFormValues = z.infer<typeof createHouseSchema>

interface CreateHouseFormProps {
  onCreated?: () => void
}

const BASIC_IMAGE_URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

export function CreateHouseForm({ onCreated }: CreateHouseFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [mainImageUrl, setMainImageUrl] = useState("")
  const [galleryImageUrl, setGalleryImageUrl] = useState("")
  const [galleryImages, setGalleryImages] = useState<string[]>([])
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

  const isValidImageUrl = useCallback((value: string) => {
    return BASIC_IMAGE_URL_REGEX.test(value.trim())
  }, [])

  const onSubmit = useCallback(
    async (values: CreateHouseFormValues) => {
      const normalizedMainImageUrl = mainImageUrl.trim()

      if (!normalizedMainImageUrl) {
        toast({
          title: "Imagen faltante",
          description: "Ingresa la URL de la imagen principal",
          variant: "destructive",
        })
        return
      }

      if (!isValidImageUrl(normalizedMainImageUrl)) {
        toast({
          title: "URL invalida",
          description: "La imagen principal debe empezar con http:// o https://",
          variant: "destructive",
        })
        return
      }

      if (galleryImages.length === 0) {
        toast({
          title: "Galeria vacia",
          description: "Anade al menos una URL de imagen a la galeria",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        const result = await createAccommodation({
          ...values,
          mainImage: normalizedMainImageUrl,
          images: galleryImages.map((imageUrl) => imageUrl.trim()),
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
          title: "Casa creada",
          description: `"${result.data?.title}" esta lista`,
        })

        form.reset()
        setMainImageUrl("")
        setGalleryImageUrl("")
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
    [form, mainImageUrl, galleryImages, toast, onCreated, isValidImageUrl]
  )

  const handleGalleryImageAdd = useCallback(() => {
    const normalizedValue = galleryImageUrl.trim()

    if (galleryImages.length >= 5) {
      toast({
        title: "Limite alcanzado",
        description: "Maximo 5 imagenes en galeria",
        variant: "destructive",
      })
      return
    }

    if (!normalizedValue) {
      toast({
        title: "URL faltante",
        description: "Ingresa una URL para anadirla a la galeria",
        variant: "destructive",
      })
      return
    }

    if (!isValidImageUrl(normalizedValue)) {
      toast({
        title: "URL invalida",
        description: "La URL debe empezar con http:// o https://",
        variant: "destructive",
      })
      return
    }

    setGalleryImages((previousImages) => [...previousImages, normalizedValue])
    setGalleryImageUrl("")
  }, [galleryImageUrl, galleryImages.length, toast, isValidImageUrl])

  const removeGalleryImage = useCallback((index: number) => {
    setGalleryImages((previousImages) => previousImages.filter((_, imageIndex) => imageIndex !== index))
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nueva Casa</CardTitle>
        <CardDescription>Anade una nueva propiedad a tu inventario</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Cabana en el valle" {...field} />
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
                      <FormLabel>Descripcion</FormLabel>
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
                      <FormLabel>Ubicacion</FormLabel>
                      <FormControl>
                        <Input placeholder="Cerca al Parque del Cafe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

                <div>
                  <FormLabel className="mb-2 block">Imagen Principal</FormLabel>
                  <div className="space-y-3">
                    <Input
                      type="url"
                      placeholder="https://images.example.com/main.jpg"
                      value={mainImageUrl}
                      onChange={(event) => setMainImageUrl(event.target.value)}
                    />
                    {mainImageUrl.trim() && (
                      <div className="relative h-32 overflow-hidden rounded-lg border bg-muted">
                        <Image
                          src={mainImageUrl.trim()}
                          alt="Vista previa imagen principal"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Usa una URL completa que empiece por http:// o https://
                    </p>
                  </div>
                </div>

                <div>
                  <FormLabel className="mb-2 block">Galeria ({galleryImages.length}/5)</FormLabel>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://images.example.com/gallery-1.jpg"
                        value={galleryImageUrl}
                        onChange={(event) => setGalleryImageUrl(event.target.value)}
                        disabled={galleryImages.length >= 5}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGalleryImageAdd}
                        disabled={galleryImages.length >= 5}
                      >
                        <Upload className="h-4 w-4" />
                        <span className="sr-only">Anadir imagen</span>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Agrega al menos una URL de imagen para la galeria.
                    </p>
                  </div>

                  {galleryImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {galleryImages.map((imageUrl, index) => (
                        <div key={`${imageUrl}-${index}`} className="relative h-16 overflow-hidden rounded group">
                          <Image
                            src={imageUrl}
                            alt={`Gallery ${index}`}
                            fill
                            unoptimized
                            className="object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
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
              disabled={isLoading || !mainImageUrl.trim() || galleryImages.length === 0}
            >
              {isLoading ? "Creando..." : "Crear Casa"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
