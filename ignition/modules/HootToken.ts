import { buildModule } from "@nomicfoundation/ignition-core";

export default buildModule("HootTokenModule", (m) => {
  const hootToken = m.contract("HootToken", [m.getAccount(0)]);
  return { hootToken };
});