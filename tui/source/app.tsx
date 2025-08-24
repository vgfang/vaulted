import React from 'react';
import {ScreenProvider} from './hooks/screen-context';
import {Router} from './router';

export default function App() {
	return (
		<ScreenProvider>
			<Router />
		</ScreenProvider>
	);
}
