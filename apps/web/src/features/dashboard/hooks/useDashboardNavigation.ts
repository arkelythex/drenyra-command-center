import { useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import {
	createDateFromMonthYear,
	extractMonthYear,
	getMonthName,
	isCurrentMonth,
	isFutureMonth,
	isValidMonthYear,
} from "@/lib/date-utils";

export const useDashboardNavigation = () => {
	const navigate = useNavigate({ from: "/dashboard" });

	// Get search params from URL (month and year)
	const searchParams = useSearch({ from: "/dashboard" }) as {
		month?: number;
		year?: number;
	};

	// Derive selectedDate from URL params or default to current date
	const selectedDate = useMemo(() => {
		const { month, year } = searchParams;

		// If valid month and year in URL, use them
		if (month && year && isValidMonthYear(month, year)) {
			return createDateFromMonthYear(month, year);
		}

		// Otherwise, default to current date
		return new Date();
	}, [searchParams]);

	// Check if next month would be in the future
	const nextMonthDate = new Date(selectedDate);
	nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
	const isNextMonthDisabled = isFutureMonth(nextMonthDate);

	// Navigation Logic
	const handlePreviousMonth = () => {
		const newDate = new Date(selectedDate);
		newDate.setMonth(newDate.getMonth() - 1);
		const { month, year } = extractMonthYear(newDate);
		navigate({ search: (prev) => ({ ...prev, month, year }) });
	};

	const handleNextMonth = () => {
		if (isNextMonthDisabled) return;
		const newDate = new Date(selectedDate);
		newDate.setMonth(newDate.getMonth() + 1);
		const { month, year } = extractMonthYear(newDate);
		navigate({ search: (prev) => ({ ...prev, month, year }) });
	};

	const handleMonthSelect = (monthIndex: string) => {
		const newDate = new Date(selectedDate);
		newDate.setMonth(parseInt(monthIndex));
		const { month, year } = extractMonthYear(newDate);
		navigate({ search: (prev) => ({ ...prev, month, year }) });
	};

	const availableMonths = useMemo(() => {
		const currentYear = selectedDate.getFullYear();
		return Array.from({ length: 12 }, (_, index) => {
			const monthDate = new Date(currentYear, index, 1);
			return {
				index,
				name: getMonthName(monthDate),
				disabled: isFutureMonth(monthDate),
			};
		});
	}, [selectedDate]);

	return {
		selectedDate,
		handlePreviousMonth,
		handleNextMonth,
		handleMonthSelect,
		availableMonths,
		isNextMonthDisabled,
	};
};
