export const formatDateTime = (date: number | null) => {
	if (date === 0 || date === null) {
		return 'Hidden';
	}
	return new Date(date).toISOString();
};

export const formatDate = (date: number | null) => {
	if (date === 0 || date === null) {
		return 'Hidden';
	}
	return new Date(date).toISOString().split('T')[0];
};

export const hasValidTimestamp = (timestamp: number | null): boolean => {
	return timestamp !== null && timestamp !== 0;
};

export const formatDateFriendly = (date: number | null) => {
	if (date === 0 || date === null) {
		return 'Hidden';
	}

	const dateObj = new Date(date);
	const now = new Date();
	const diffTime = now.getTime() - dateObj.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	// if today
	if (diffDays === 0) {
		return `today at ${dateObj.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		})}`;
	}

	// if yesterday
	if (diffDays === 1) {
		return `yesterday at ${dateObj.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		})}`;
	}

	// if within the last week
	if (diffDays < 7) {
		return `${dateObj.toLocaleDateString('en-US', {
			weekday: 'long',
		})} at ${dateObj.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		})}`;
	}

	// if this year
	if (dateObj.getFullYear() === now.getFullYear()) {
		return dateObj.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
		});
	}

	// older dates
	return dateObj.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
};
