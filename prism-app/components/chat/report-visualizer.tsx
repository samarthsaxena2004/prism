'use client'

import React, { useEffect, useState } from 'react'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

let MapContainer: any = null;
let TileLayer: any = null;
let Marker: any = null;
let Popup: any = null;
let Polyline: any = null;

export function ReportVisualizer({ jsonText }: { jsonText: string }) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [data, setData] = useState<any>(null)
  
  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonText)
      setData(parsed)
    } catch(e) {
      console.error("Failed to parse visualization json", e)
    }
  }, [jsonText])

  useEffect(() => {
    if (data?.type === 'logistics_map') {
      import('react-leaflet').then((m) => {
        MapContainer = m.MapContainer;
        TileLayer = m.TileLayer;
        Marker = m.Marker;
        Popup = m.Popup;
        Polyline = m.Polyline;
        setMapLoaded(true)
      })
    }
  }, [data])

  if (!data) return null;

  if (data.type === 'medical_radar') {
    return (
      <div className="w-full h-[300px] mt-6 bg-card border rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-4 left-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Vitals Radar</div>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.data}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 200]} tick={false} axisLine={false} />
            <Radar name="Vitals" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (data.type === 'financial_area') {
    return (
      <div className="w-full h-[300px] mt-6 bg-card border rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-4 left-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Revenue vs Expenses</div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.data} margin={{ top: 40, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="var(--border)" tick={{ fill: 'var(--muted-foreground)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
            <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" />
            <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (data.type === 'logistics_map' && mapLoaded && MapContainer) {
    // Default coords if not provided
    const origin = data.origin || [40.7128, -74.0060] // NY
    const dest = data.destination || [34.0522, -118.2437] // LA
    const center = [(origin[0]+dest[0])/2, (origin[1]+dest[1])/2]

    return (
      <div className="w-full h-[300px] mt-6 bg-card border rounded-xl overflow-hidden shadow-sm relative z-0">
        <div className="absolute top-4 left-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase z-10 bg-background/80 backdrop-blur px-2 py-1 rounded">Shipment Routing</div>
        <MapContainer center={center} zoom={3} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <Marker position={origin}><Popup>Origin</Popup></Marker>
          <Marker position={dest}><Popup>Destination</Popup></Marker>
          <Polyline positions={[origin, dest]} color="#3b82f6" dashArray="5, 10" />
        </MapContainer>
      </div>
    )
  }

  if (data.type === 'government_stepper') {
    return (
      <div className="w-full mt-6 bg-card border rounded-xl p-6 shadow-sm">
        <div className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-6">Approval Workflow</div>
        <div className="relative border-l-2 border-muted ml-3 space-y-6">
          {data.steps?.map((step: any, i: number) => (
            <div key={i} className="relative pl-6">
              <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-card ${step.status === 'completed' ? 'bg-green-500' : step.status === 'current' ? 'bg-blue-500 animate-pulse' : 'bg-muted'}`}></div>
              <div className={`text-sm font-medium ${step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>{step.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{step.description}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  if (data.type === 'insurance_gauge') {
    return (
      <div className="w-full mt-6 bg-card border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center">
        <div className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-2">Approval Probability</div>
        <div className="relative w-48 h-24 overflow-hidden mt-4">
          <div className="absolute inset-0 border-[16px] border-muted rounded-t-full border-b-0"></div>
          <div 
            className="absolute inset-0 border-[16px] border-blue-500 rounded-t-full border-b-0 origin-bottom transition-transform duration-1000 ease-out"
            style={{ transform: `rotate(${(data.probability || 0) * 1.8 - 180}deg)` }}
          ></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-2xl font-bold">{data.probability}%</div>
        </div>
      </div>
    )
  }

  return null
}
