<script>
	import OffseasonModal from '../../../components/baseball/OffseasonModal.svelte';
	import GameForm from '../../../components/baseball/GameForm.svelte';
	import StatsTable from '../../../components/baseball/StatsTable.svelte';
	import baseball_info from '../../../info/baseball_info.json';
	import '/node_modules/flag-icons/css/flag-icons.min.css';
	import RetireTable from '../../../components/baseball/RetireTable.svelte';
	import { Label, Select, Heading, Button } from 'flowbite-svelte';

	let nationality = 'us',
		teamName,
		teamNumber,
		position = 2,
		offers = [],
		lastScore;

	let overall = {
			contact: {
				current: 0,
				potential: 0
			},
			power: {
				current: 0,
				potential: 0
			},
			fielding: {
				current: 0,
				potential: 0
			},
			development: 0
		},
		lastOverall = {};

	let year = 1,
		isOffseason;

	let stats = [],
		allStarAppearances = 0,
		mvps = 0,
		worldSeries = 0,
		totalSalary = 0,
		retired = false;

	let contractPay = 7,
		contractLength = 1;

	let showStartForm = true;

	$: updateTeam(teamNumber);

	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	async function handleSubmitStart() {
		showStartForm = false;
		await generatePlayer();
	}

	function handleAdvanceYear() {
		contractLength--;
		generateYear();
		if (contractLength == 0 && year <= 12) simulateFreeAgency();
	}

	async function generatePlayer() {
		const choseNation = baseball_info.nationalities.find(
			(nation) => nation.abbreviation === nationality
		);
		const chosePosition = baseball_info.positions[position - 1];

		overall.contact.potential = getRandomInt(25, 90) + choseNation.contact + chosePosition.contact;
		overall.power.potential = getRandomInt(25, 90) + choseNation.power + chosePosition.power;
		overall.fielding.potential =
			getRandomInt(25, 90) + choseNation.fielding + chosePosition.fielding;

		overall.contact.current = getRandomInt(
			20 + choseNation.contact + chosePosition.contact,
			overall.contact.potential
		);
		overall.power.current = getRandomInt(
			20 + choseNation.power + chosePosition.power,
			overall.power.potential
		);
		overall.fielding.current = getRandomInt(
			20 + choseNation.fielding + chosePosition.fielding,
			overall.fielding.potential
		);

		overall.development = getRandomInt(1, 10);

		teamNumber = getRandomInt(0, baseball_info.teams.length - 1);
		teamName = baseball_info.teams[teamNumber].name;
	}

	function generateYear() {
		totalSalary += contractPay;
		let average = Math.round(
				(getRandomInt(overall.contact.current - 10, overall.contact.current) / 100) * 500
			),
			home_runs = getRandomInt(overall.power.current - 30, overall.power.current - 20),
			drs = Math.round(
				((getRandomInt(overall.fielding.current - 10, overall.fielding.current) - 40) / 100) * 20
			);

		if (home_runs < 0) home_runs = 0;

		const score = average * 2 + home_runs * 10 + drs * 20;
		const isAllStar = score >= 850;
		const isMVP = score >= 1100;
		if (isAllStar) allStarAppearances++;
		if (isMVP) mvps++;
		lastScore = score;

		const teamScore = score + getRandomInt(20, 60 - baseball_info.teams[teamNumber].rank) * 150;
		if (teamScore > 7000) worldSeries++;

		stats.push({
			year: year + new Date().getFullYear() - 1,
			average,
			home_runs,
			drs,
			score,
			teamName,
			all_star: isAllStar,
			mvp: isMVP
		});

		stats = [...stats];

		updateOverall();
		year++;
	}

	function simulateFreeAgency() {
		offers = [];
		let salaries = [];
		if (stats[stats.length - 1].mvp) {
			salaries.push(
				getRandomInt(Math.round(12 * (lastScore / 100)), Math.round(10 * (lastScore / 100)) * 2 + 2)
			);
			salaries.push(
				getRandomInt(Math.round(12 * (lastScore / 100)), Math.round(10 * (lastScore / 100)) * 2 + 2)
			);
		} else if (stats[stats.length - 1].all_star) {
			salaries.push(
				getRandomInt(Math.round(8 * (lastScore / 100)), Math.round(7 * (lastScore / 100)) * 2 + 2)
			);
			salaries.push(
				getRandomInt(Math.round(8 * (lastScore / 100)), Math.round(7 * (lastScore / 100)) * 2 + 2)
			);
		} else {
			salaries.push(
				getRandomInt(Math.round(5 * (lastScore / 100)), Math.round(5 * (lastScore / 100)) * 2 + 2)
			);
			salaries.push(
				getRandomInt(Math.round(5 * (lastScore / 100)), Math.round(5 * (lastScore / 100)) * 2 + 2)
			);
		}
		//generate offer one
		offers.push({
			number: getRandomInt(0, baseball_info.teams.length - 1),
			salary: salaries[0],
			years: getRandomInt(1, 3)
		});
		while (offers[0].number == teamNumber) {
			offers[0].number = getRandomInt(0, baseball_info.teams.length - 1);
		}
		//generate offer two
		offers.push({
			number: getRandomInt(0, baseball_info.teams.length - 1),
			salary: salaries[1],
			years: getRandomInt(1, 6)
		});
		while (offers[1].number == teamNumber || offers[0].number == offers[1].number) {
			offers[1].number = getRandomInt(0, baseball_info.teams.length - 1);
		}
		isOffseason();
	}

	function updateOverall() {
		lastOverall = JSON.parse(JSON.stringify(overall));
		overall.contact.current = checkOverallUpdate(
			overall.contact.current,
			overall.contact.potential
		);
		overall.power.current = checkOverallUpdate(overall.power.current, overall.power.potential);
		overall.fielding.current = checkOverallUpdate(
			overall.fielding.current,
			overall.fielding.potential
		);
	}

	function checkOverallUpdate(current, potential) {
		// check if regressing
		if (year > 6) {
			overall.development -= getRandomInt(0, 2);
		}
		// the amount that could be added
		let addition = overall.development - (5 - baseball_info.teams[teamNumber].development);

		if (current >= potential) return current;

		if (overall.development < 0) return getRandomInt(current + overall.development, current);
		if (potential - current >= addition) return getRandomInt(current, current + addition);
		else return getRandomInt(current, potential);
	}

	function endCareer() {
		retired = true;
		console.log(retired);
	}

	function updateTeam(number) {
		if (teamNumber != null) {
			teamName = baseball_info.teams[number].name;
			teamNumber = number;
		}
	}

	function handleMessage(event) {
		if (event.detail.text == 'advanceYear') {
			handleAdvanceYear();
		} else if (event.detail.text == 'endCareer') {
			endCareer();
		}
	}
</script>

<svelte:head>
	<title>My Sports Career - Baseball Game</title>
	<meta
		name="description"
		content="Experience Realistic Simulated Baseball Games - Play our immersive virtual baseball simulation, strategic gameplay, and thrilling seasons. Dive into the world of virtual baseball today!"
	/>
</svelte:head>

<div>
	{#if showStartForm}
		<div class="flex flex-col items-center gap-2">
			<div>
				<Heading tag="h3">Welcome to My MLB Career</Heading>
			</div>
			<div>
				<Label for="nationalities">Nation</Label>
				<Select name="nationalities" id="nationalities" placeholder="" bind:value={nationality}>
					{#each baseball_info.nationalities as nation}
						<option value={nation.abbreviation}>{nation.name}</option>
					{/each}
				</Select>
			</div>
			<div>
				<Label for="positions">Position</Label>
				<Select name="positions" id="positions" placeholder="" bind:value={position}>
					{#each baseball_info.positions as position}
						{#if position.name != 'P'}
							<option value={position.number}>{position.name}</option>
						{/if}
					{/each}
				</Select>
			</div>

			<div>
				<Button on:click={handleSubmitStart} type="submit">Submit</Button>
			</div>
		</div>
		<!-- </div> -->
	{/if}

	{#if !showStartForm}
		<GameForm
			{teamName}
			{overall}
			{lastOverall}
			{nationality}
			{year}
			{position}
			{retired}
			{contractPay}
			{stats}
			{worldSeries}
			{totalSalary}
			{mvps}
			on:message={handleMessage}
		/>
	{/if}

	<div class="grid grid-row-1" />

	{#if stats.length > 0}
		<div class="grid md:grid-cols-1 lg:grid-cols-2 px-8 lg:space-x-3">
			<StatsTable {stats} />
		</div>
	{/if}

	{#if retired}
		<RetireTable {stats} {allStarAppearances} {mvps} {worldSeries} {totalSalary} />
	{/if}

	<OffseasonModal
		bind:open={isOffseason}
		{offers}
		bind:teamNumber
		bind:salary={contractPay}
		bind:years={contractLength}
		on:message={handleMessage}
	/>
</div>
