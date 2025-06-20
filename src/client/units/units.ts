export class Unit {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  async init() { }
  response() { }
  render() { }
}

let unitList: Unit[] = [];

export function unitAdd(unit: Unit) {
  //console.log("Unit created: " + unit.name);
  unitList.push(unit);
}

export function unitDelete(unit: Unit) {
  unitList = unitList.filter((u) => u != unit);
}

export async function unitsInit() {
  for (let i: number = 0; i < unitList.length; i++) {
    await unitList[i].init();
  }
}

export function unitsResponse() {
  for (let i: number = 0; i < unitList.length; i++) {
    unitList[i].response();
  }
}

export function unitsRender() {
  for (let i: number = 0; i < unitList.length; i++) {
    unitList[i].render();
  }
}