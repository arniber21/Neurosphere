import { useEffect, useRef } from 'react'

export function Welcome() {
	const iframeRef = useRef<HTMLIFrameElement>(null)

	useEffect(() => {
		// You can customize the iframe or add additional logic here if needed
	}, [])

	return (
		<main className="flex flex-col items-center justify-center w-full h-screen">
			<div className="w-full h-full flex-1">
				<iframe 
					ref={iframeRef}
					src="/display.html" 
					className="w-full h-full border-0" 
					title="K3D snapshot viewer"
				/>
			</div>
		</main>
	)
}