import { themes } from '../themes';

export const withDefaultTheme = (props) => {
    const theme = props.theme || themes.default;
    return {
        ...props,
        theme
    };
}; 