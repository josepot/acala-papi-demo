import { start } from "polkadot-api/smoldot"
import { chainSpec as polkadotChainspec } from "polkadot-api/chains/polkadot"
import { getSmProvider } from "polkadot-api/sm-provider"
import { withLogsRecorder } from "polkadot-api/logs-provider"
import { Enum, createClient } from "polkadot-api"
import chainSpec from "./acala-chainspec"
import { acala } from "@polkadot-api/descriptors"

const smoldot = start()

const polkadot = await smoldot.addChain({
  chainSpec: polkadotChainspec,
  disableJsonRpc: true,
})

const acalaChain = smoldot.addChain({
  chainSpec,
  potentialRelayChains: [polkadot],
})

const client = createClient(
  withLogsRecorder(console.log, getSmProvider(acalaChain)),
)

const acalaApi = client.getTypedApi(acala)

const [allAccounts, totalDotIssuance] = await Promise.all([
  acalaApi.query.Tokens.Accounts.getEntries(),
  acalaApi.query.Tokens.TotalIssuance.getValue(Enum("Token", Enum("DOT"))),
])

client.destroy()
smoldot.terminate()

const totalDots = allAccounts
  .filter(
    ({ keyArgs: [, token] }) => token.is("Token") && token.value.is("DOT"),
  )
  .map(({ value }) => value.free + value.reserved)
  .reduce((a, b) => a + b)

console.log({ totalDots, totalDotIssuance })
