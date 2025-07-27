import GeneratePlanResult from "./GeneratePlanResult";

interface props {
  id: string;
}

const PageGeneratePlanResult = (props: props) => {
  const { id } = props;
  return <GeneratePlanResult id={id}></GeneratePlanResult>;
};

export default PageGeneratePlanResult;
