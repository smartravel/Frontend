import * as L from 'leaflet'
import { Alert, Box, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import type { ItineraryItem, ItineraryRatingSummary } from '../../entities/itinerary'

type RouteMapDay = {
  date: string
  label: string
  items: ItineraryItem[]
}

type MapPoint = {
  item: ItineraryItem
  dayIndex: number
  itemNumber: number
  position: [number, number]
}

type RouteSegment = {
  date: string
  dayIndex: number
  positions: [number, number][]
  distance: number
  duration: number
  color: string
  fallback: boolean
}

type OsrmResponse = {
  code?: string
  routes?: Array<{
    distance: number
    duration: number
    geometry: { coordinates: [number, number][] }
  }>
}

const OSRM_FOOT_URL = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving'
const KAZAN_CENTER: [number, number] = [55.7961, 49.1064]
const DAY_COLORS = ['#0E7C86', '#F28F3B', '#5378B8', '#8B6AB1', '#4F8A63']

function getDayColor(dayIndex: number) {
  return DAY_COLORS[dayIndex % DAY_COLORS.length]
}

function hasCoordinates(item: ItineraryItem): item is ItineraryItem & { lat: number; lng: number } {
  return (
    typeof item.lat === 'number' &&
    Number.isFinite(item.lat) &&
    item.lat >= -90 &&
    item.lat <= 90 &&
    typeof item.lng === 'number' &&
    Number.isFinite(item.lng) &&
    item.lng >= -180 &&
    item.lng <= 180
  )
}

function wait(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Запрос отменён', 'AbortError'))
      return
    }
    const timeout = window.setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, milliseconds)
    const abort = () => {
      window.clearTimeout(timeout)
      reject(new DOMException('Запрос отменён', 'AbortError'))
    }
    signal.addEventListener('abort', abort, { once: true })
  })
}

async function requestWalkingRoute(
  points: MapPoint[],
  signal: AbortSignal,
): Promise<Pick<RouteSegment, 'positions' | 'distance' | 'duration'>> {
  const coordinates = points.map(({ item }) => `${item.lng},${item.lat}`).join(';')
  const url = `${OSRM_FOOT_URL}/${coordinates}?overview=full&geometries=geojson&steps=false`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`)

  const data = (await response.json()) as OsrmResponse
  const route = data.routes?.[0]
  if (data.code !== 'Ok' || !route?.geometry?.coordinates?.length) {
    throw new Error('OSRM не смог построить маршрут')
  }

  return {
    positions: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distance: route.distance,
    duration: route.duration,
  }
}

function MapViewport({ points }: { points: MapPoint[] }) {
  const map = useMap()
  const coordinatesKey = points.map(({ position }) => position.join(',')).join(';')

  useEffect(() => {
    if (points.length === 0) {
      map.setView(KAZAN_CENTER, 12)
      return
    }

    const bounds = L.latLngBounds(points.map(({ position }) => position))
    if (points.length === 1) {
      map.setView(points[0].position, 15)
    } else {
      map.fitBounds(bounds, { padding: [38, 38], maxZoom: 15 })
    }
  }, [coordinatesKey, map, points])

  return null
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} м`
  return `${(meters / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} км`
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours} ч ${remainingMinutes} мин` : `${hours} ч`
}

export function RouteMap({
  days,
  ratingSummaries,
}: {
  days: RouteMapDay[]
  ratingSummaries: Record<string, ItineraryRatingSummary>
}) {
  const points = useMemo(() => {
    let itemNumber = 0
    return days.flatMap((day, dayIndex) =>
      [...day.items]
        .sort((first, second) => first.position - second.position)
        .map((item) => {
          itemNumber += 1
          return hasCoordinates(item)
            ? {
                item,
                dayIndex,
                itemNumber,
                position: [item.lat, item.lng] as [number, number],
              }
            : null
        })
        .filter((point): point is MapPoint => point !== null),
    )
  }, [days])

  const [segments, setSegments] = useState<RouteSegment[]>([])
  const [routesLoading, setRoutesLoading] = useState(false)
  const [routeError, setRouteError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const routeDays = days
      .map((day, dayIndex) => ({
        day,
        dayIndex,
        points: points.filter((point) => point.dayIndex === dayIndex),
      }))
      .filter(({ points: dayPoints }) => dayPoints.length >= 2)

    if (routeDays.length === 0) {
      setSegments([])
      setRoutesLoading(false)
      setRouteError(false)
      return () => controller.abort()
    }

    async function loadRoutes() {
      setRoutesLoading(true)
      setRouteError(false)
      const nextSegments: RouteSegment[] = []

      for (const routeDay of routeDays) {
        try {
          // The public FOSSGIS demo service asks clients not to exceed one request per second.
          await wait(1100, controller.signal)
          const route = await requestWalkingRoute(routeDay.points, controller.signal)
          nextSegments.push({
            date: routeDay.day.date,
            dayIndex: routeDay.dayIndex,
            ...route,
            color: getDayColor(routeDay.dayIndex),
            fallback: false,
          })
        } catch {
          if (controller.signal.aborted) return
          nextSegments.push({
            date: routeDay.day.date,
            dayIndex: routeDay.dayIndex,
            positions: routeDay.points.map(({ position }) => position),
            distance: 0,
            duration: 0,
            color: getDayColor(routeDay.dayIndex),
            fallback: true,
          })
        }
      }

      if (!controller.signal.aborted) {
        setSegments(nextSegments)
        setRouteError(nextSegments.some((segment) => segment.fallback))
        setRoutesLoading(false)
      }
    }

    void loadRoutes()
    return () => controller.abort()
  }, [days, points])

  const legendDays = days.filter((day) => day.items.length > 0)
  const missingCoordinates = days.reduce(
    (count, day) => count + day.items.filter((item) => !hasCoordinates(item)).length,
    0,
  )

  return (
    <Box
      component="aside"
      aria-label="Интерактивная карта маршрута"
      sx={{
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        p: 1.75,
        border: '1px solid #E3E8EF',
        borderRadius: '20px',
        bgcolor: '#FFFFFF',
        '& .leaflet-container': {
          width: '100%',
          height: '100%',
          fontFamily: 'Manrope, sans-serif',
          zIndex: 0,
        },
        '& .leaflet-control-attribution': {
          fontSize: '10px',
        },
        '& .leaflet-popup-content-wrapper': {
          borderRadius: '12px',
        },
        '& .leaflet-popup-content': {
          margin: '10px 12px',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: { xs: 300, lg: 520 },
          minWidth: 0,
          overflow: 'hidden',
          borderRadius: '14px',
          bgcolor: '#E9F1F4',
          isolation: 'isolate',
        }}
      >
        <MapContainer
          center={points[0]?.position ?? KAZAN_CENTER}
          zoom={12}
          scrollWheelZoom={false}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          />
          <MapViewport points={points} />

          {segments.map((segment) => (
            <Polyline
              key={segment.date}
              positions={segment.positions}
              pathOptions={{
                color: segment.color,
                weight: 5,
                opacity: 0.88,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: segment.fallback ? '8 9' : undefined,
              }}
            />
          ))}

          {points.map(({ item, dayIndex, itemNumber, position }) => {
            const color = getDayColor(dayIndex)
            const rating = ratingSummaries[item.id]
            const markerIcon = L.divIcon({
              className: '',
              html: `<span style="display:flex;width:34px;height:34px;box-sizing:border-box;align-items:center;justify-content:center;border:3px solid #FFFFFF;border-radius:50% 50% 50% 0;background:${color};box-shadow:0 2px 8px rgba(27,36,51,.28);color:#FFFFFF;font-family:Manrope,sans-serif;font-size:13px;font-weight:800;transform:rotate(-45deg)"><span style="transform:rotate(45deg)">${itemNumber}</span></span>`,
              iconSize: [36, 36],
              iconAnchor: [18, 18],
            })

            return (
              <Marker key={item.id} position={position} icon={markerIcon}>
                <Popup>
                  <Stack
                    spacing={0.5}
                    sx={{ minWidth: 160, color: '#1B2433', fontFamily: 'Manrope, sans-serif' }}
                  >
                    <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                      {itemNumber}. {item.title}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: '#657080' }}>
                      День {dayIndex + 1}
                      {item.time ? ` · ${item.time}` : ''}
                    </Typography>
                    {item.note && (
                      <Typography sx={{ fontSize: 12, color: '#657080' }}>{item.note}</Typography>
                    )}
                    {rating?.average_rating !== null && rating?.average_rating !== undefined && (
                      <Typography sx={{ fontSize: 12 }}>
                        Оценка участников: ★ {rating.average_rating.toFixed(1)} (
                        {rating.ratings_count})
                      </Typography>
                    )}
                    {rating?.google_rating !== null && rating?.google_rating !== undefined && (
                      <Typography sx={{ fontSize: 12 }}>
                        Google (демо): ★ {rating.google_rating.toFixed(1)}
                      </Typography>
                    )}
                  </Stack>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{
            position: 'absolute',
            zIndex: 500,
            top: 1.5,
            left: 1.5,
            pointerEvents: 'none',
          }}
        >
          <Chip
            size="small"
            label="OpenStreetMap"
            sx={{
              bgcolor: 'rgba(255,255,255,.94)',
              color: '#3D4757',
              fontSize: 10,
              fontWeight: 700,
              boxShadow: '0 1px 5px rgba(27,36,51,.12)',
            }}
          />
          <Chip
            size="small"
            label="Пеший маршрут · OSRM"
            sx={{
              bgcolor: 'rgba(255,255,255,.94)',
              color: '#3D4757',
              fontSize: 10,
              fontWeight: 700,
              boxShadow: '0 1px 5px rgba(27,36,51,.12)',
            }}
          />
          {routesLoading && <CircularProgress size={15} aria-label="Строим маршрут" />}
        </Stack>

        {points.length === 0 && (
          <Box
            sx={{
              position: 'absolute',
              zIndex: 450,
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                maxWidth: 260,
                p: 1.5,
                borderRadius: '12px',
                bgcolor: 'rgba(255,255,255,.9)',
                color: '#657080',
              }}
            >
              Добавьте координаты мест, чтобы увидеть их на карте
            </Typography>
          </Box>
        )}
      </Box>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
        {legendDays.map((day) => {
          const dayIndex = days.indexOf(day)
          const segment = segments.find((entry) => entry.date === day.date)
          return (
            <Stack key={day.date} direction="row" spacing={0.75} alignItems="center">
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  flex: 'none',
                  borderRadius: '50%',
                  bgcolor: getDayColor(dayIndex),
                }}
              />
              <Typography sx={{ fontSize: 13, color: '#3D4757', fontWeight: 700 }}>
                День {dayIndex + 1}
                {segment &&
                  !segment.fallback &&
                  ` · ${formatDistance(segment.distance)} · ${formatDuration(segment.duration)}`}
              </Typography>
            </Stack>
          )
        })}
      </Stack>

      {routeError && (
        <Alert severity="info" sx={{ borderRadius: '10px', fontSize: 12 }}>
          Сервис маршрутизации временно недоступен. Показана прямая пунктирная линия между точками.
        </Alert>
      )}
      {missingCoordinates > 0 && (
        <Alert severity="info" sx={{ borderRadius: '10px', fontSize: 12 }}>
          У {missingCoordinates}{' '}
          {missingCoordinates === 1 ? 'пункта нет координат' : 'пунктов нет координат'}. Укажи
          широту и долготу в форме редактирования, чтобы добавить их на карту.
        </Alert>
      )}
      <Typography
        sx={{
          color: '#748091',
          fontSize: 11,
          '& a': {
            color: '#0E7C86',
            textDecoration: 'underline',
          },
        }}
      >
        Маршруты: OSRM / FOSSGIS ·{' '}
        <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">
          Сообщить об ошибке карты
        </a>
      </Typography>
    </Box>
  )
}
