import { writable } from 'svelte/store';
import owners from '$lib/data/horse-owners.json';

export const gameHorses = writable([]);
export const userBalance = writable(100000);
export const userHorse = writable(null);
export const horseOwners = writable(owners);
export const week = writable(1);
export const enteredRace = writable({});
