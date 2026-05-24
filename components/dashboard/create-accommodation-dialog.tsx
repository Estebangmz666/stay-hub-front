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
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [mainImageUrl, setMainImageUrl] = useState("")
  const [mainImageMode, setMainImageMode] = useState<"file" | "url">("file")
  const [galleryImages, setGalleryImages] = useState<File[]>([])
  const [galleryUrls, setGalleryUrls] = useState<string[]>([])
  const [galleryMode, setGalleryMode] = useState<"file" | "url">("file")
  const [tempGalleryUrl, setTempGalleryUrl] = useState("")
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
      // Validar imagen principal
      const hasMainImage = mainImageMode === "file" ? mainImage : mainImageUrl.trim()
      if (!hasMainImage) {
        toast({
          title: "Imagen principal faltante",
          description: mainImageMode === "file" ? "Selecciona una imagen" : "Pega una URL válida",
          variant: "destructive",
        })
        return
      }

      // Validar galería
      const hasGalleryImages = galleryMode === "file" ? galleryImages.length > 0 : galleryUrls.length > 0
      if (!hasGalleryImages) {
        toast({
          title: "Galería vacía",
          description: galleryMode === "file" ? "Añade al menos una imagen" : "Añade al menos una URL",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        // Procesar imagen principal
        const mainImageData =
          mainImageMode === "file" && mainImage
            ? await convertFileToBase64(mainImage)
            : mainImageUrl.trim()

        // Procesar galería
        const galleryData =
          galleryMode === "file"
            ? await Promise.all(galleryImages.map(convertFileToBase64))
            : galleryUrls

        const result = await createAccommodation({
          ...values,
          mainImage: mainImageData,
          images: galleryData,
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
        setMainImage(null)
        setMainImageUrl("")
        setGalleryImages([])
        setGalleryUrls([])
        setTempGalleryUrl("")
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
    [form, mainImage, mainImageUrl, mainImageMode, galleryImages, galleryUrls, galleryMode, toast, onCreated]
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
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setMainImageMode("file")}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        mainImageMode === "file"
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Subir archivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setMainImageMode("url")}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        mainImageMode === "url"
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Pegar URL
                    </button>
                  </div>

                  {mainImageMode === "file" ? (
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
                  ) : (
                    <Input
                      type="url"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={mainImageUrl}
                      onChange={(e) => setMainImageUrl(e.target.value)}
                      className="w-full"
                    />
                  )}
                </div>

                <div>
                  <FormLabel className="mb-2 block">Galería</FormLabel>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setGalleryMode("file")}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        galleryMode === "file"
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Subir archivos
                    </button>
                    <button
                      type="button"
                      onClick={() => setGalleryMode("url")}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        galleryMode === "url"
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Pegar URLs
                    </button>
                    <span className="text-xs text-muted-foreground ml-auto flex items-center">
                      {galleryMode === "file" ? galleryImages.length : galleryUrls.length}/5
                    </span>
                  </div>

                  {galleryMode === "file" ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          placeholder="https://ejemplo.com/imagen.jpg"
                          value={tempGalleryUrl}
                          onChange={(e) => setTempGalleryUrl(e.target.value)}
                          className="w-full"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (tempGalleryUrl.trim()) {
                              if (galleryUrls.length >= 5) {
                                toast({
                                  title: "Límite alcanzado",
                                  description: "Máximo 5 imágenes en galería",
                                  variant: "destructive",
                                })
                                return
                              }
                              setGalleryUrls([...galleryUrls, tempGalleryUrl.trim()])
                              setTempGalleryUrl("")
                            }
                          }}
                          disabled={!tempGalleryUrl.trim() || galleryUrls.length >= 5}
                        >
                          Añadir
                        </Button>
                      </div>

                      {galleryUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {galleryUrls.map((url, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={url}
                                alt={`Gallery ${idx}`}
                                className="w-full h-16 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%23999' font-size='14'%3EError%3C/text%3E%3C/svg%3E"
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setGalleryUrls(galleryUrls.filter((_, i) => i !== idx))}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isLoading ||
                !(mainImageMode === "file" ? mainImage : mainImageUrl.trim()) ||
                !(galleryMode === "file" ? galleryImages.length > 0 : galleryUrls.length > 0)
              }
            >
              {isLoading ? "Creando..." : "Crear Casa"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
