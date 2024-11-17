import React, { useState, useCallback } from "react";
import "./App.css";

// Regex constants
const VARIABLE_REGEX = /[a-zA-Z_]\w*/g;
const EXPONENT_REGEX = /\(([^)]+)\)\^(\d+)/g;
const SIMPLE_EXPONENT_REGEX = /([a-zA-Z_]\w*)\^(\d+)/g;
const IMPLICIT_MULTIPLY_REGEX_1 = /(\d)([a-zA-Z_]\w*)/g;
const IMPLICIT_MULTIPLY_REGEX_2 = /([a-zA-Z_]\w*)/g;

interface Variables {
  [key: string]: number;
}

/**
 * TEST CASES:
    1. a + b - c
    2. 2a + 3b - c
    3. a^2 + b^2
    4. (a + b)^3
    5. (a / b) + (b / c)
    6. (a^2 + b^2) / c
    7. a^2 - b^3 + (c / d)
    8. (a + b) * (c - d)
    9. (a + b^2) * (c - d^2)
    10. x^2 + y^2 + z^2
    11. (x_1 * y_1 + z_1) / a_1
 */

export const ExpressionToLatex: React.FC = () => {
  const [formula, setFormula] = useState<string>("");
  const [variables, setVariables] = useState<Variables>({});
  const [result, setResult] = useState<number | string | null>(null);

  /**
   * collects input from the formula field, which user edits. checks for duplicates and generates variables.
   * For example, (c + c) is valid, but its variable is made only once.
   */
  const handleFormulaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputFormula = e.target.value;
      setFormula(inputFormula);

      const uniqueVariables = Array.from(
        new Set(inputFormula.match(VARIABLE_REGEX))
      );

      const initialVariables: Variables = {};
      uniqueVariables.forEach((variable) => {
        initialVariables[variable] = 0;
      });

      setVariables(initialVariables);
    },
    []
  );

  /**
   * This collects all user inputs from auto-generated fields and applies
   * a float transform.
   */
  const handleVariableChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, variable: string) => {
      const updatedVariables = {
        ...variables,
        [variable]: parseFloat(e.target.value) || 0,
      };
      setVariables(updatedVariables);
      calculateResult(updatedVariables);
    },
    [variables]
  );

  /**
   * The main function, which performs a variety of transforms:
   *
   * 1. converts "^" to manual exponentiation. Since ^ is a reserved bitwise XOR operator in JS
   * 2. converts "ab" into "a*b" and similarly, "2a" into "2*a"
   * 3. performs multiplication at spot
   * 4. handles variables of the form of x_1, y_2 (subscripted)
   */
  const calculateResult = useCallback(
    (variables: Variables) => {
      if (!formula) {
        setResult("Please enter a formula above");
        return;
      }

      try {
        const expression = formula
          .replace(EXPONENT_REGEX, (_, base, exponent) => {
            return `(${base})**${exponent}`;
          })
          .replace(SIMPLE_EXPONENT_REGEX, (_, base, exponent) => {
            if (variables.hasOwnProperty(base)) {
              return `(${variables[base]})**${exponent}`;
            }
            throw new Error(`Variable "${base}" is not defined.`);
          })
          .replace(IMPLICIT_MULTIPLY_REGEX_1, "$1*$2")
          .replace(IMPLICIT_MULTIPLY_REGEX_2, (match) => {
            if (variables.hasOwnProperty(match)) {
              return variables[match].toString();
            }
            throw new Error(`Variable "${match}" is not defined.`);
          });

        console.log("Evaluating expression: ", expression);

        // This is the direct replacement of doing "window.eval"
        const result = new Function(`return ${expression}`)();
        console.log("Computed result:", result);
        setResult(result);
      } catch (error) {
        console.error("Calculation error: ", (error as Error).message);
        setResult("Error");
      }
    },
    [formula]
  );

  /**
   * This function is responsible for rendering a LaTeX style formula
   */
  const renderFormula = useCallback(() => {
    return formula
      .replace(EXPONENT_REGEX, "($1)<sup>$2</sup>")
      .replace(SIMPLE_EXPONENT_REGEX, "$1<sup>$2</sup>")
      .replace(/(\w)_(\d+)/g, "$1<sub>$2</sub>");
  }, [formula]);

  const handleReset = useCallback(() => {
    setFormula("");
    setVariables({});
    setResult(null);
  }, []);

  return (
    <div className="app">
      <h1 className="title">Formula Calculator</h1>
      <input
        type="text"
        value={formula}
        onChange={handleFormulaChange}
        placeholder="Enter formula"
        className="formula-input"
      />
      <div
        className="formula-display"
        dangerouslySetInnerHTML={{ __html: renderFormula() }}
      />
      <div className="variables-container">
        {Object.keys(variables).map((variable) => (
          <div key={variable} className="variable-input">
            <label>
              {variable}:{" "}
              <input
                type="text"
                value={variables[variable]}
                onChange={(e) => handleVariableChange(e, variable)}
                className="number-input"
              />
            </label>
          </div>
        ))}
      </div>
      {result !== null && (
        <div className={`result ${result === "Error" ? "error" : ""}`}>
          {result}
        </div>
      )}
      <button onClick={handleReset} className="reset-button">
        Reset
      </button>
    </div>
  );
};
