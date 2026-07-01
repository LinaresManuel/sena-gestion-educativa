import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { BookOpen, Users, Building, Home, LayoutDashboard, MapPin, Calendar } from "lucide-react";

import RegionalesView from "./components/RegionalesView";
import CentrosView from "./components/CentrosView";
import AmbientesView from "./components/AmbientesView";
import TiposAmbienteView from "./components/TiposAmbienteView";
import ProgramasView from "./components/ProgramasView";
import InstructoresView from "./components/InstructoresView";
import FichasView from "./components/FichasView";
import ProgramacionInstructoresView from "./components/ProgramacionInstructoresView";

function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard de Programación</h1>
      <p className="text-gray-500">
        Bienvenido al sistema de programación de horarios. Selecciona un módulo en el menú lateral para comenzar a gestionar los recursos.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <Link to="/regionales" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <MapPin className="w-10 h-10 text-amber-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Regionales</h2>
          <p className="text-sm text-gray-600">Administra las zonas y regionales del país.</p>
        </Link>
        <Link to="/centros" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <Building className="w-10 h-10 text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Centros de Formación</h2>
          <p className="text-sm text-gray-600">Gestiona los centros y regionales del sistema.</p>
        </Link>
        <Link to="/ambientes" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <Home className="w-10 h-10 text-green-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ambientes</h2>
          <p className="text-sm text-gray-600">Administra los salones, talleres y demás espacios físicos.</p>
        </Link>
        <Link to="/programas" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <BookOpen className="w-10 h-10 text-red-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Programas</h2>
          <p className="text-sm text-gray-600">Gestor de programas de formación y titulaciones.</p>
        </Link>
        <Link to="/instructores" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <Users className="w-10 h-10 text-purple-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Instructores</h2>
          <p className="text-sm text-gray-600">Registra instructores y sus perfiles académicos.</p>
        </Link>
        <Link to="/fichas" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <BookOpen className="w-10 h-10 text-emerald-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Fichas / Cursos</h2>
          <p className="text-sm text-gray-600">Registra fichas con sus ambientes y horarios asignados.</p>
        </Link>
        <Link to="/programacion" className="p-6 border rounded-xl hover:shadow-md transition bg-white block">
          <Calendar className="w-10 h-10 text-indigo-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Programación</h2>
          <p className="text-sm text-gray-600">Asigna instructores a resultados de aprendizaje.</p>
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold tracking-tight">SenaSchedule</span>
            </div>
            <nav className="space-y-1">
              <Link to="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                <LayoutDashboard className="w-5 h-5 text-gray-500" /> Dashboard
              </Link>
              <Link to="/regionales" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                <MapPin className="w-5 h-5 text-gray-500" /> Regionales
              </Link>
              <Link to="/centros" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                <Building className="w-5 h-5 text-gray-500" /> Centros
              </Link>
              <Link to="/ambientes" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                <Home className="w-5 h-5 text-gray-500" /> Ambientes
              </Link>
              <Link to="/tipos-ambiente" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                <Home className="w-5 h-5 text-gray-400 ml-1" /> Tipos de Ambientes
              </Link>
              <Link to="/programas" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                <BookOpen className="w-5 h-5 text-gray-500" /> Programas
              </Link>
              <Link to="/instructores" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                <Users className="w-5 h-5 text-gray-500" /> Instructores
              </Link>
              <Link to="/fichas" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                <BookOpen className="w-5 h-5 text-emerald-600" /> Fichas
              </Link>
              <Link to="/programacion" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                <Calendar className="w-5 h-5 text-indigo-500" /> Programación
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/regionales" element={<RegionalesView />} />
            <Route path="/centros" element={<CentrosView />} />
            <Route path="/ambientes" element={<AmbientesView />} />
            <Route path="/tipos-ambiente" element={<TiposAmbienteView />} />
            <Route path="/programas" element={<ProgramasView />} />
            <Route path="/instructores" element={<InstructoresView />} />
            <Route path="/fichas" element={<FichasView />} />
            <Route path="/programacion" element={<ProgramacionInstructoresView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
