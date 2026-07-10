export interface ChartDataPoint {
  day: string;
  sleepHours: number;
  bpSystolic: number;
  bpDiastolic: number;
  glucose: number;
  steps: number;
}

export const weeklyHealthData: ChartDataPoint[] = [
  { day: "Mon", sleepHours: 6.2, bpSystolic: 135, bpDiastolic: 86, glucose: 108, steps: 4800 },
  { day: "Tue", sleepHours: 5.8, bpSystolic: 138, bpDiastolic: 88, glucose: 114, steps: 4200 },
  { day: "Wed", sleepHours: 5.5, bpSystolic: 142, bpDiastolic: 92, glucose: 119, steps: 3500 },
  { day: "Thu", sleepHours: 6.0, bpSystolic: 139, bpDiastolic: 89, glucose: 112, steps: 5100 },
  { day: "Fri", sleepHours: 6.8, bpSystolic: 132, bpDiastolic: 84, glucose: 105, steps: 6000 },
  { day: "Sat", sleepHours: 7.2, bpSystolic: 126, bpDiastolic: 82, glucose: 98, steps: 8200 },
  { day: "Sun", sleepHours: 7.5, bpSystolic: 124, bpDiastolic: 80, glucose: 95, steps: 9400 },
];
