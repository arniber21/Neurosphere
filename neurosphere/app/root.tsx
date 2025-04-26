import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import { ClerkProvider } from '@clerk/clerk-react'

import type { Route } from './+types/root'
import './app.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export const meta: Route.Meta = () => {
	return [
		{ title: 'Neurosphere - Brain Tumor Analysis' },
		{ name: 'description', content: 'Neurosphere - Advanced Brain Tumor Analysis and Visualization' },
	]
}

function Document({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}

export function ErrorBoundary() {
	const error = isRouteErrorResponse()
	return (
		<Document>
			<div className="error-container">
				<h1>Oops!</h1>
				{error ? (
					<p>Status: {error.status}</p>
				) : (
					<p>Something went wrong. Please try again later.</p>
				)}
			</div>
		</Document>
	)
}

export default function Root() {
	return (
		<ClerkProvider publishableKey={publishableKey}>
			<Document>
				<Outlet />
			</Document>
		</ClerkProvider>
	)
}
