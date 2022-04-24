import {utils, Script,Cell}from "@ckb-lumos/lumos";

export function sumCkbCapacity(cells: Cell[]) : bigint{
    return cells.reduce((acc, cell)=>acc+=BigInt(cell.cell_output.capacity), BigInt(0));
}

export function sumSudtAmount(cells: Cell[], sudtScript: Script):bigint{
    return cells.reduce((acc, cell)=>{
        const amount = cell.cell_output.type === sudtScript ? acc+utils.readBigUInt128LE(cell.data) : BigInt(0);
        return acc+amount;
    }, BigInt(0));
}
