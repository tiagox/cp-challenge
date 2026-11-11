/* eslint-disable react-refresh/only-export-components -- route config module, not a component file */
import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'

const InstrumentsPage = lazy(() => import('@/pages/instruments/InstrumentsPage'))
const PortfolioPage = lazy(() => import('@/pages/portfolio/PortfolioPage'))
const NotFoundPage = lazy(() => import('@/pages/not-found/NotFoundPage'))

/** Shared by the browser router and the memory router used in tests. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/instruments" replace /> },
      { path: 'instruments', element: <InstrumentsPage /> },
      { path: 'portfolio', element: <PortfolioPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
