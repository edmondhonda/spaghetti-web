$(function() {
    consoleInit();
    start(main);
});

async function main() {
    print_warning();

    const stakingTokenAddr = WBTC_TOKEN_ADDR;
    const stakingTokenTicker = "WBTC";
    const rewardPoolAddr = WBTC_REWARD_ADDR;
    const rewardTokenAddr = PASTA_TOKEN_ADDR;
    const rewardTokenTicker = "PASTA";

    const App = await init_ethers();

    _print(`Initialized ${App.YOUR_ADDRESS}`);
    _print("Reading smart contracts...\n");
    _print(`${rewardTokenTicker} Address: ${rewardTokenAddr}`);
    _print(`Reward Pool Address: ${rewardPoolAddr}\n`);

    const P_STAKING_POOL = new ethers.Contract(rewardPoolAddr, P_STAKING_POOL_ABI, App.provider);
    const Y_TOKEN = new ethers.Contract(stakingTokenAddr, ERC20_ABI, App.provider);

    const stakedYAmount = await P_STAKING_POOL.balanceOf(App.YOUR_ADDRESS) / 1e8;
    const earnedYFFI = await P_STAKING_POOL.earned(App.YOUR_ADDRESS) / 1e18;
    const totalSupplyY = await Y_TOKEN.totalSupply() / 1e8;
    const totalStakedYAmount = await Y_TOKEN.balanceOf(rewardPoolAddr) / 1e8;

    // Find out reward rate
    const weekly_reward = await get_synth_weekly_rewards(P_STAKING_POOL) / 1e18;
    const nextHalving = await getPeriodFinishForReward(P_STAKING_POOL);

    const rewardPerToken = weekly_reward / totalStakedYAmount;

    // Find out underlying assets of Y
    const unstakedY = await Y_TOKEN.balanceOf(App.YOUR_ADDRESS) / 1e8;

    const prices = await lookUpPrices(["wrapped-bitcoin", "ethereum", "spaghetti"]);
    const stakingTokenPrice = prices["wrapped-bitcoin"].usd;
    const rewardTokenPrice = prices["spaghetti"].usd;
    _print("========== PRICES ==========")
    _print(`1 ${rewardTokenTicker}  = $${rewardTokenPrice}`);
    _print(`1 ${stakingTokenTicker}  = $${stakingTokenPrice}\n`);
   _print("============== STAKING ==============")
   _print(`There are total   : ${totalSupplyY} ${stakingTokenTicker}.`);
   _print(`There are total   : ${totalStakedYAmount} ${stakingTokenTicker} staked in ${rewardTokenTicker}'s ${stakingTokenTicker} staking pool.`);
   _print(`                  = ${toDollar(totalStakedYAmount * stakingTokenPrice)}\n`);
   _print(`You are staking   : ${stakedYAmount} ${stakingTokenTicker} (${toFixed(stakedYAmount * 100 / totalStakedYAmount, 3)}% of the pool)`);
   _print(`                  = ${toDollar(stakedYAmount * stakingTokenPrice)}\n`);
   _print(`\n======== 🍝 ${rewardTokenTicker} REWARDS 🍝 ========`)
   _print(`Claimable Rewards : ${toFixed(earnedYFFI, 4)} ${rewardTokenTicker} = $${toFixed(earnedYFFI * rewardTokenPrice, 2)}`);
   const YFFIWeeklyEstimate = rewardPerToken * stakedYAmount;
   _print(`Hourly estimate   : ${toFixed(YFFIWeeklyEstimate / (24 * 7), 4)} ${rewardTokenTicker} = ${toDollar((YFFIWeeklyEstimate / (24 * 7)) * rewardTokenPrice)} (out of total ${toFixed(weekly_reward / (7 * 24), 2)} ${rewardTokenTicker})`)
   _print(`Daily estimate    : ${toFixed(YFFIWeeklyEstimate / 7, 2)} ${rewardTokenTicker} = ${toDollar((YFFIWeeklyEstimate / 7) * rewardTokenPrice)} (out of total ${toFixed(weekly_reward / 7, 2)} ${rewardTokenTicker})`)
   _print(`Weekly estimate   : ${toFixed(YFFIWeeklyEstimate, 2)} ${rewardTokenTicker} = ${toDollar(YFFIWeeklyEstimate * rewardTokenPrice)} (out of total ${weekly_reward} ${rewardTokenTicker})`)
   const YFIWeeklyROI = (rewardPerToken * rewardTokenPrice) * 100 / (stakingTokenPrice);

   _print(`\nHourly ROI in USD : ${toFixed((YFIWeeklyROI / 7) / 24, 4)}%`)
   _print(`Daily ROI in USD  : ${toFixed(YFIWeeklyROI / 7, 4)}%`)
   _print(`Weekly ROI in USD : ${toFixed(YFIWeeklyROI, 4)}%`)
   _print(`APY (unstable)    : ${toFixed(YFIWeeklyROI * 52, 4)}% \n`)

    const timeTilHalving = nextHalving - (Date.now() / 1000);

    if (timeTilHalving > 604800) {
        _print(`Reward starting   : in ${forHumans(timeTilHalving - 604800)} \n`);
    } else {
        _print(`Reward ending     : in ${forHumans(timeTilHalving)} \n`);
    }

    const approveTENDAndStake = async function () {
        return rewardsContract_stakeWBTC(stakingTokenAddr, rewardPoolAddr, App);
    };

    const unstake = async function() {
        return rewardsContract_unstake(rewardPoolAddr, App);
    };

    const claim = async function() {
        return rewardsContract_claim(rewardPoolAddr, App);
    };

    const exit = async function() {
        return rewardsContract_exitWBTC(rewardPoolAddr, App);
    };

    _print_link(`Stake ${unstakedY} ${stakingTokenTicker}`, approveTENDAndStake);
    _print_link(`Unstake ${stakedYAmount} ${stakingTokenTicker}`, unstake);
    _print_link(`Claim ${earnedYFFI} ${rewardTokenTicker}`, claim);
    _print_link(`Exit`, exit);

    hideLoading();

}