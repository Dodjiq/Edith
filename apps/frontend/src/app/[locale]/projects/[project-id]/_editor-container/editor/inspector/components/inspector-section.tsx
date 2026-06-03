export const InspectorSection: React.FC<{
	children: React.ReactNode;
}> = ({children}) => {
	return <div className="px-4 py-3">{children}</div>;
};

export const InspectorDivider: React.FC = () => {
	return <div className="h-[1px] bg-white/10"></div>;
};
