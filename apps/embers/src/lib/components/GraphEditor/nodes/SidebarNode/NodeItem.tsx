import type React from "react";

import styles from './NodeItem.module.scss';

interface NodeItemProps {
  name: string;
}

export const NodeItem: React.FC<NodeItemProps> = ({ name }) => {
  return (
    <div draggable className={styles['node-item']}>
      <span>{name}</span>
      <i aria-hidden="true" className="fa fa-grip-vertical"/>
    </div>
  );
};