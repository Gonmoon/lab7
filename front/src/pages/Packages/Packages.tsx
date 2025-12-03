import React from 'react';
import Export from '@shared/blocks/Export';
import Charts from '@shared/blocks/Charts';
import DnD from '@shared/blocks/DnD';
import Table from '@shared/blocks/Table';


const Packages: React.FC = () => {
	return (
		<>
		 <Export />
		 <Charts />
		 <DnD />
		 <Table />
		</>
	)
}

export default Packages;