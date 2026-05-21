import { apiClient } from "@/lib/api/client"

export interface AccommodationHost {
  id: number
  email: string
  fullName: string
}

export interface AccommodationDetailResponse {
  id: number
  host: AccommodationHost
  title: string
  description: string
  capacity: number
  pricePerNight: number
  mainImage?: string
  locationDescription: string
  city: string
  images: string[]
  available: boolean
}

export interface CreateAccommodationRequest {
  title: string
  description: string
  capacity: number
  currency: string
  pricePerNight: string
  mainImage: string
  longitude: number
  latitude: number
  locationDescription: string
  city: string
  images: string[]
}

export interface CreateAccommodationResponse {
  id: number
  hostId: number
  hostEmail: string
  title: string
  description: string
  capacity: number
  currency: string
  pricePerNight: number
  mainImage: string
  longitude: number
  latitude: number
  locationDescription: string
  city: string
  images: string[]
  available: boolean
  createdAt: string
  updatedAt: string
}

export interface MessageResponse {
  message: string
}

export async function createAccommodation(data: CreateAccommodationRequest) {
  return apiClient<CreateAccommodationResponse>(`/api/v2/accommodations`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getAccommodationById(id: number) {
  return apiClient<AccommodationDetailResponse>(`/api/v2/accommodations/${id}`, {
    method: "GET",
  })
}

/** Soft-deletes an accommodation if it has no future active reservations */
export async function deactivateAccommodation(id: number) {
  return apiClient<MessageResponse>(`/api/v2/accommodations/${id}`, {
    method: "DELETE",
  })
}
