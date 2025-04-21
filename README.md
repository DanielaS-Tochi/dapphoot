# 🦉 dAppHoot

> Nota legal: **dAppHoot** es un proyecto educativo y experimental inspirado en la dinámica de juegos de trivia, pero **no está afiliado, respaldado ni asociado de ninguna manera con Kahoot! ni con sus propietarios**. Todos los nombres, marcas y logotipos mencionados (si así fuera) son propiedad de sus respectivos dueños. El objetivo de dAppHoot es ofrecer una experiencia única y original en el ámbito de la gamificación educativa en Web3.

---

## 👩‍💻 Desarrolladores

- Daniela Silvana Tochi

---

## 🚀 ¿Qué es dAppHoot?

**dAppHoot** es una aplicación descentralizada (dApp) de trivia en la que los jugadores responden preguntas, ganan tokens ERC-20 (`HootToken`) y compiten en un leaderboard. Todo funciona sobre contratos inteligentes en Ethereum, con roles de administrador y lógica de premios segura.

---

## 📁 Estructura del Proyecto


---

## ⚙️ Instalación y uso rápido

1. **Clona el repo e instala dependencias:**
   ```bash
   git clone <tu-repo>
   cd dapphoot
   npm install
   ```
2. **Compila los contratos:**
   ```bash
   npx hardhat compile
   ```
3. **Levanta un nodo local:**
   ```bash
   npx hardhat node
   ```
4. **Ejecuta los tests:**
   ```bash
   npx hardhat test
   ```
Todos los tests deben pasar ✅

## Contratos inteligentes
dAppHoot.sol:
Solo admin puede crear preguntas.
Los jugadores responden y ganan tokens si aciertan.
Leaderboard en tiempo real.
Seguridad con OpenZeppelin AccessControl.
HootToken.sol:
bash
CopyInsert in Terminal
npx hardhat node
Ejecuta los tests:
bash
CopyInsert in Terminal
npx hardhat test
Todos los tests deben pasar ✅

## Contratos inteligentes
dAppHoot.sol:
Solo admin puede crear preguntas.
Los jugadores responden y ganan tokens si aciertan.
Leaderboard en tiempo real.
Seguridad con OpenZeppelin AccessControl.
HootToken.sol:
Token ERC-20 estándar.
Solo minters autorizados pueden mintear.

 ## 🧪 Testing
Tests completos en TypeScript con Viem y Chai.
Cada test inicia con un deploy limpio para evitar contaminación de estado.
Se testean roles, recompensas, leaderboard y seguridad.


