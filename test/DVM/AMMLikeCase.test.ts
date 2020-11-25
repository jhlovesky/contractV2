/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

// import * as assert from 'assert';

import { decimalStr, gweiStr } from '../utils/Converter';
import { logGas } from '../utils/Log';
import { DVMContext, getDVMContext } from '../utils/DVMContext';
import { assert } from 'chai';

let lp: string;
let trader: string;

async function init(ctx: DVMContext): Promise<void> {
  lp = ctx.SpareAccounts[0];
  trader = ctx.SpareAccounts[1];

  await ctx.mintTestToken(lp, decimalStr("10"), decimalStr("1000"));
  await ctx.mintTestToken(trader, decimalStr("10"), decimalStr("1000"));

  await ctx.transferBaseToDVM(lp, decimalStr("10"))
  await ctx.transferQuoteToDVM(lp, decimalStr("1000"))
  await ctx.DVM.methods.buyShares(lp).send(ctx.sendParam(lp));

  console.log("deposit")
}

describe("AMMLikeCase", () => {
  let snapshotId: string;
  let ctx: DVMContext;

  before(async () => {
    let AMMLikeDVMContextInitConfig = {
      lpFeeRate: decimalStr("0.002"),
      mtFeeRate: decimalStr("0.001"),
      k: decimalStr("1"),
      i: "1",
    };
    ctx = await getDVMContext(AMMLikeDVMContextInitConfig);
    await init(ctx);
  });

  beforeEach(async () => {
    snapshotId = await ctx.EVM.snapshot();
  });

  afterEach(async () => {
    await ctx.EVM.reset(snapshotId);
  });

  describe("trade", () => {

    it("basic state", async () => {
      console.log(await ctx.DVM.methods.getMidPrice().call())
      console.log(await ctx.DVM.methods.getBase0().call())
    })

    it("buy & sell", async () => {

      console.log("BASE0 before buy", await ctx.DVM.methods.getBase0().call())

      // buy
      await ctx.transferQuoteToDVM(trader, decimalStr("200"))
      await ctx.DVM.methods.sellQuote(trader).send(ctx.sendParam(trader))
      console.log("BASE0 after buy", await ctx.DVM.methods.getBase0().call())
      // trader balances
      console.log(
        await ctx.BASE.methods.balanceOf(trader).call(),
        "11946763594380080787"
      );
      console.log(
        await ctx.QUOTE.methods.balanceOf(trader).call(),
        decimalStr("800")
      );
      // vault balances
      console.log(
        await ctx.BASE.methods.balanceOf(ctx.DVM.options.address).call(),
        "8051283784161162863"
      );
      console.log(
        await ctx.QUOTE.methods.balanceOf(ctx.DVM.options.address).call(),
        decimalStr("200")
      );
      // maintainer balances
      console.log(
        await ctx.BASE.methods.balanceOf(ctx.Maintainer).call(),
        "1952621458756350"
      );
      console.log(
        await ctx.QUOTE.methods.balanceOf(ctx.Maintainer).call(),
        decimalStr("0")
      );

      // // sell
      // await logGas(ctx.DVMProxy.methods.sellBaseOnDVM(ctx.DVM.options.address, trader, decimalStr("1"), decimalStr("100")), ctx.sendParam(trader), "sell base token")
      // console.log("BASE0 after sell", await ctx.DVM.methods.getBase0().call())
      // // trader balances
      // assert.equal(
      //   await ctx.BASE.methods.balanceOf(trader).call(),
      //   "10946763594380080787"
      // );
      // assert.equal(
      //   await ctx.QUOTE.methods.balanceOf(trader).call(),
      //   "903421810640399874603"
      // );
      // // vault balances
      // assert.equal(
      //   await ctx.BASE.methods.balanceOf(ctx.DVM.options.address).call(),
      //   "9051283784161162863"
      // );
      // assert.equal(
      //   await ctx.QUOTE.methods.balanceOf(ctx.DVM.options.address).call(),
      //   "96474456349930717298"
      // );
      // // maintainer balances
      // assert.equal(
      //   await ctx.BASE.methods.balanceOf(ctx.Maintainer).call(),
      //   "1952621458756350"
      // );
      // assert.equal(
      //   await ctx.QUOTE.methods.balanceOf(ctx.Maintainer).call(),
      //   "103733009669408099"
      // );

      // // buy when quoet is not 0
      // await logGas(ctx.DVMProxy.methods.sellQuoteOnDVM(ctx.DVM.options.address, trader, decimalStr("200"), decimalStr("1")), ctx.sendParam(trader), "buy base token")
      // assert.equal("BASE0 after second buy", await ctx.DVM.methods.getBase0().call())
      // // trader balances
      // assert.equal(
      //   await ctx.BASE.methods.balanceOf(trader).call(),
      //   "12837528824326616018"
      // );
      // assert.equal(
      //   await ctx.QUOTE.methods.balanceOf(trader).call(),
      //   "703421810640399874603"
      // );
      // // vault balances
      // assert.equal(
      //   await ctx.BASE.methods.balanceOf(ctx.DVM.options.address).call(),
      //   "7158622099620899913"
      // );
      // assert.equal(
      //   await ctx.QUOTE.methods.balanceOf(ctx.DVM.options.address).call(),
      //   "296474456349930717298"
      // );
      // // maintainer balances
      // assert.equal(
      //   await ctx.BASE.methods.balanceOf(ctx.Maintainer).call(),
      //   "3849076052484069"
      // );
      // assert.equal(
      //   await ctx.QUOTE.methods.balanceOf(ctx.Maintainer).call(),
      //   "103733009669408099"
      // );
    });
  });
});