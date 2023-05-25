import React from 'react';
import { Link } from '@umijs/max';
import styles from './index.less';

// logo
const Logo: React.FC = () => {
  return (
    <Link to="/">
      <img
        className={styles.logo}
        src={require('@/assets/images/logo_title.png')}
        alt="logo"
      />
    </Link>
  );
};

export default Logo;
