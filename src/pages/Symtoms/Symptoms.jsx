import React, { useEffect, useState } from "react";
import { SymptomForm } from "../../components/SymptomForm";
import { SymptomChart } from "../../components/SymptomChart";

export const Symptoms = () => {
 
  return(
    <div className="grid grid-cols-1 md:grid-cols-2  gap-4 mt-4">
      <SymptomForm />
      <SymptomChart  /> 
    </div> 
  );
};
