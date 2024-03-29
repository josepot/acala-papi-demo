import { start } from "smoldot"
import { polkadot as polkadotChainspec } from "@substrate/connect-known-chains"
import { getSmProvider } from "@polkadot-api/sm-provider"
import { getChain } from "@polkadot-api/node-polkadot-provider"
import { Enum, createClient } from "@polkadot-api/client"
import chainSpec from "./acala-chainspec"
import acala from "./codegen/acala"

const smoldot = start()

const polkadot = await smoldot.addChain({
  chainSpec: polkadotChainspec,
  disableJsonRpc: true,
})

const client = createClient(
  getChain({
    provider: getSmProvider(smoldot, {
      chainSpec,
      potentialRelayChains: [polkadot],
    }),
    keyring: [],
  }),
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
