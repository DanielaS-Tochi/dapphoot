import { buildModule } from "@nomicfoundation/ignition-core";

export default buildModule("dAppHootModule", (m) => {
  const hootToken = m.contract("HootToken", [m.getAccount(0)]);
  const dAppHoot = m.contract("dAppHoot", [hootToken, m.getAccount(0)]);
  // Otorga el rol de minter a dAppHoot si tu contrato lo requiere
  // Puedes agregar más lógica aquí si lo necesitas
  return { hootToken, dAppHoot };
});